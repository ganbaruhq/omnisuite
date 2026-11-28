import { Result } from "effect";
import { describe, expect, it } from "vite-plus/test";
import {
  decodeEditingResult,
  decodeTimelineResult,
  editFingerprintOf,
  editGestureLogic,
  evaluateGesture,
  gestureRowOf,
  gestureStartOf,
  canStepGesture,
  unreportedRuleErrorOf,
  type Editing,
  type GestureRequest,
  type Timeline,
  type CalendarEventInput,
  type EditingInput,
  type TimelineInput,
} from "./index.js";

const stay = (
  overrides: Partial<CalendarEventInput> & Pick<CalendarEventInput, "id">,
): CalendarEventInput => ({
  resourceIds: ["room-101"],
  title: overrides.id,
  start: "2026-10-26T09:00Z",
  end: "2026-10-26T10:00Z",
  ...overrides,
});

const timelineOf = (overrides: Partial<TimelineInput> = {}) => {
  const decoded = decodeTimelineResult({
    range: { start: "2026-10-26T00:00Z", end: "2026-10-27T00:00Z" },
    slotDuration: "PT1H",
    resources: [
      { id: "floor", title: "First floor", kind: "group" },
      { id: "room-101", title: "Room 101", parentId: "floor" },
      { id: "room-102", title: "Room 102", parentId: "floor" },
      { id: "room-201", title: "Room 201" },
    ],
    events: [stay({ id: "emma" })],
    ...overrides,
  });
  if (Result.isFailure(decoded)) throw new Error(decoded.failure.message);
  return decoded.success;
};

const editingOf = (input: Partial<EditingInput> = {}) => {
  const decoded = decodeEditingResult({
    snap: "PT30M",
    startEditable: true,
    resourceEditable: true,
    durationEditable: true,
    ...input,
  });
  if (Result.isFailure(decoded)) throw new Error(decoded.failure.message);
  return decoded.success;
};

const moveRequest = {
  input: "keyboard",
  operation: "move",
  eventId: "emma",
  resourceId: "room-101",
} as const;

describe("gestureStartOf", () => {
  it("starts a move or a resize the event allows, stamped with the event's fingerprint", () => {
    const timeline = timelineOf();
    const emma = timeline.events[0]!;
    expect(gestureStartOf(timeline, editingOf(), undefined, moveRequest)).toEqual({
      input: "keyboard",
      operation: "move",
      eventId: "emma",
      sourceResourceId: "room-101",
      fingerprint: editFingerprintOf(emma),
    });
    expect(
      gestureStartOf(timeline, editingOf(), undefined, {
        ...moveRequest,
        input: "pointer",
        operation: "resize",
        edge: "start",
      }),
    ).toEqual({
      input: "pointer",
      operation: "resize",
      edge: "start",
      eventId: "emma",
      sourceResourceId: "room-101",
      fingerprint: editFingerprintOf(emma),
    });
  });

  it("starts nothing while a gesture is active, without editing, or for an unknown event", () => {
    const timeline = timelineOf();
    const store = editGestureLogic.createStore();
    store.trigger.gestureStarted(gestureStartOf(timeline, editingOf(), undefined, moveRequest)!);
    const active = store.getSnapshot().context.gesture;
    expect(gestureStartOf(timeline, editingOf(), active, moveRequest)).toBeUndefined();
    expect(gestureStartOf(timeline, undefined, undefined, moveRequest)).toBeUndefined();
    expect(
      gestureStartOf(timeline, editingOf(), undefined, { ...moveRequest, eventId: "gone" }),
    ).toBeUndefined();
  });

  it("starts a move only on a movable event, and a resize only on a resizable edge", () => {
    const fixed = editingOf({ startEditable: false, resourceEditable: false });
    expect(gestureStartOf(timelineOf(), fixed, undefined, moveRequest)).toBeUndefined();
    const resize = { ...moveRequest, operation: "resize", edge: "end" } as const;
    expect(gestureStartOf(timelineOf(), fixed, undefined, resize)).toBeDefined();
    expect(
      gestureStartOf(timelineOf(), editingOf({ durationEditable: false }), undefined, resize),
    ).toBeUndefined();
    // A resize names its edge.
    expect(
      gestureStartOf(timelineOf(), editingOf(), undefined, { ...resize, edge: undefined }),
    ).toBeUndefined();
    // The event's own setting wins over the timeline's.
    const pinned = timelineOf({
      events: [stay({ id: "emma", startEditable: false, resourceEditable: false })],
    });
    expect(gestureStartOf(pinned, editingOf(), undefined, moveRequest)).toBeUndefined();
  });
});

/** The gesture a store holds once `request` has begun. */
const begun = (timeline: Timeline, editing: Editing, request: GestureRequest) => {
  const store = editGestureLogic.createStore();
  store.trigger.gestureStarted(gestureStartOf(timeline, editing, undefined, request)!);
  return store;
};

describe("canStepGesture", () => {
  it("steps a move in time only when the event's time is editable", () => {
    const timeline = timelineOf();
    const gesture = begun(timeline, editingOf(), moveRequest).getSnapshot().context.gesture!;
    expect(canStepGesture(timeline, editingOf(), gesture)).toBe(true);
    // Movable across rows only: the arrows along the time axis do nothing.
    expect(canStepGesture(timeline, editingOf({ startEditable: false }), gesture)).toBe(false);
  });

  it("steps a resize only while the duration is editable, and nothing once the event is gone", () => {
    const timeline = timelineOf();
    const resize = { ...moveRequest, operation: "resize", edge: "end" } as const;
    const gesture = begun(timeline, editingOf(), resize).getSnapshot().context.gesture!;
    expect(canStepGesture(timeline, editingOf({ startEditable: false }), gesture)).toBe(true);
    expect(canStepGesture(timeline, editingOf({ durationEditable: false }), gesture)).toBe(false);
    expect(canStepGesture(timelineOf({ events: [] }), editingOf(), gesture)).toBe(false);
  });
});

describe("gestureRowOf", () => {
  it("is the resource row `by` rows away from the gesture's target, skipping group headings", () => {
    const timeline = timelineOf();
    const store = begun(timeline, editingOf(), moveRequest);
    const at = () => store.getSnapshot().context.gesture!;
    expect(gestureRowOf(timeline, editingOf(), timeline.rows, at(), 1)).toBe("room-102");
    expect(gestureRowOf(timeline, editingOf(), timeline.rows, at(), 2)).toBe("room-201");
    store.trigger.retargeted({ resourceId: "room-201" });
    expect(gestureRowOf(timeline, editingOf(), timeline.rows, at(), -1)).toBe("room-102");
  });

  it("is undefined past the first or last row, or outside the rows shown", () => {
    const timeline = timelineOf();
    const gesture = begun(timeline, editingOf(), moveRequest).getSnapshot().context.gesture!;
    expect(gestureRowOf(timeline, editingOf(), timeline.rows, gesture, -1)).toBeUndefined();
    expect(gestureRowOf(timeline, editingOf(), timeline.rows, gesture, 3)).toBeUndefined();
    const hidden = timeline.rows.filter(
      (row) => row.kind === "resource" && row.resource.id !== "room-101",
    );
    expect(gestureRowOf(timeline, editingOf(), hidden, gesture, 1)).toBeUndefined();
  });

  it("keeps a resize in its row, and an event that cannot change resource in its own", () => {
    const timeline = timelineOf();
    const resize = { ...moveRequest, operation: "resize", edge: "end" } as const;
    const resizing = begun(timeline, editingOf(), resize).getSnapshot().context.gesture!;
    expect(gestureRowOf(timeline, editingOf(), timeline.rows, resizing, 1)).toBeUndefined();
    const moving = begun(timeline, editingOf(), moveRequest).getSnapshot().context.gesture!;
    expect(
      gestureRowOf(timeline, editingOf({ resourceEditable: false }), timeline.rows, moving, 1),
    ).toBeUndefined();
  });
});

describe("evaluateGesture", () => {
  it("moves the event by the shift to the target row", () => {
    const timeline = timelineOf();
    const store = begun(timeline, editingOf(), moveRequest);
    store.trigger.retargeted({ resourceId: "room-102" });
    const evaluation = evaluateGesture(
      timeline,
      editingOf(),
      store.getSnapshot().context.gesture!,
      {
        shift: { steps: 2 },
        targetResourceId: "room-201",
      },
    );
    expect(evaluation).toMatchObject({
      status: "allowed",
      proposal: {
        operation: "move",
        sourceResourceId: "room-101",
        targetResourceId: "room-201",
        after: {
          resourceIds: ["room-201"],
          start: "2026-10-26T10:00:00Z",
          end: "2026-10-26T11:00:00Z",
        },
      },
    });
  });

  it("has nothing to evaluate for a move over no row, and leaves an unshifted move unchanged", () => {
    const timeline = timelineOf();
    const gesture = begun(timeline, editingOf(), moveRequest).getSnapshot().context.gesture!;
    expect(
      evaluateGesture(timeline, editingOf(), gesture, { targetResourceId: undefined }),
    ).toBeUndefined();
    expect(
      evaluateGesture(timeline, editingOf(), gesture, { targetResourceId: "room-101" }),
    ).toMatchObject({ status: "unchanged" });
  });

  it("resizes the gesture's edge in its own row, wherever the target is", () => {
    const timeline = timelineOf();
    const resize = { ...moveRequest, operation: "resize", edge: "start" } as const;
    const gesture = begun(timeline, editingOf(), resize).getSnapshot().context.gesture!;
    expect(
      evaluateGesture(timeline, editingOf(), gesture, {
        shift: { slots: -1 },
        targetResourceId: undefined,
      }),
    ).toMatchObject({
      status: "allowed",
      proposal: {
        operation: "resize",
        edge: "start",
        targetResourceId: "room-101",
        after: { start: "2026-10-26T08:00:00Z", end: "2026-10-26T10:00:00Z" },
      },
    });
  });
});

describe("unreportedRuleErrorOf", () => {
  const thrown = new Error("allow broke");
  const allow = () => {
    throw thrown;
  };

  it("reports a rule that threw once per gesture, and again in the next gesture", () => {
    const timeline = timelineOf();
    const editing = editingOf({ allow });
    const store = begun(timeline, editing, moveRequest);
    const at = (steps: number) =>
      evaluateGesture(timeline, editing, store.getSnapshot().context.gesture!, {
        shift: { steps },
        targetResourceId: "room-101",
      });
    const first = unreportedRuleErrorOf(store.getSnapshot().context.gesture, at(1));
    expect(first).toMatchObject({ rule: "allow", error: thrown, proposal: { eventId: "emma" } });
    store.trigger.ruleReported({ rule: "allow" });
    expect(unreportedRuleErrorOf(store.getSnapshot().context.gesture, at(2))).toBeUndefined();

    store.trigger.gestureEnded();
    store.trigger.gestureStarted(gestureStartOf(timeline, editing, undefined, moveRequest)!);
    expect(unreportedRuleErrorOf(store.getSnapshot().context.gesture, at(1))).toMatchObject({
      rule: "allow",
    });
  });

  it("reports nothing for an allowed or plainly rejected destination, or without a gesture", () => {
    const timeline = timelineOf({
      events: [
        stay({ id: "emma" }),
        stay({ id: "noah", start: "2026-10-26T10:00Z", end: "2026-10-26T11:00Z" }),
      ],
    });
    const editing = editingOf({ overlap: () => false });
    const gesture = begun(timeline, editing, moveRequest).getSnapshot().context.gesture!;
    const allowed = evaluateGesture(timeline, editing, gesture, {
      shift: { steps: -2 },
      targetResourceId: "room-101",
    });
    const rejected = evaluateGesture(timeline, editing, gesture, {
      shift: { steps: 2 },
      targetResourceId: "room-101",
    });
    expect(rejected).toMatchObject({ status: "rejected", rule: "overlap" });
    expect(unreportedRuleErrorOf(gesture, allowed)).toBeUndefined();
    expect(unreportedRuleErrorOf(gesture, rejected)).toBeUndefined();
    expect(unreportedRuleErrorOf(undefined, rejected)).toBeUndefined();
  });
});
