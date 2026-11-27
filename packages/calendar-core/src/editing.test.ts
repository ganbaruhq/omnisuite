import { Result } from "effect";
import { describe, expect, it, vi } from "vite-plus/test";
import {
  decodeEditingResult,
  decodeTimelineResult,
  evaluateMove,
  evaluateResize,
  previewLayout,
  type CalendarEventInput,
  type EditingInput,
  type MoveRequest,
  type ResizeRequest,
  type TimelineInput,
} from "./index.js";

const stay = (
  overrides: Partial<CalendarEventInput> & Pick<CalendarEventInput, "id">,
): CalendarEventInput => ({
  resourceIds: ["room-101"],
  title: overrides.id,
  start: "2026-10-26T09:10Z",
  end: "2026-10-26T10:20Z",
  ...overrides,
});

const timelineInput = (overrides: Partial<TimelineInput> = {}): TimelineInput => ({
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

const timelineOf = (overrides: Partial<TimelineInput> = {}) => {
  const decoded = decodeTimelineResult(timelineInput(overrides));
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

const move = (request: Partial<MoveRequest> = {}): MoveRequest => ({
  eventId: "emma",
  sourceResourceId: "room-101",
  targetResourceId: "room-101",
  ...request,
});

const resize = (request: Partial<ResizeRequest> = {}): ResizeRequest => ({
  eventId: "emma",
  resourceId: "room-101",
  edge: "end",
  ...request,
});

/** The proposal of a move or resize that must be allowed. */
const allowed = (evaluation: ReturnType<typeof evaluateMove>) => {
  if (evaluation.status !== "allowed")
    throw new Error(`Expected an allowed edit, got ${evaluation.status}`);
  return evaluation.proposal;
};

describe("decodeEditingResult", () => {
  it("requires an explicit positive snap step", () => {
    for (const input of [{}, { snap: "PT0S" }, { snap: "PT1H30M" }, { snap: 30 }]) {
      const decoded = decodeEditingResult(input);
      expect(Result.isFailure(decoded)).toBe(true);
      if (Result.isFailure(decoded))
        expect(decoded.failure.issues[0]!.path).toEqual(["editing", "snap"]);
    }
  });

  it("keeps every capability off unless it is enabled", () => {
    const editing = editingOf({
      startEditable: undefined,
      resourceEditable: undefined,
      durationEditable: undefined,
    });
    expect(editing).toMatchObject({
      startEditable: false,
      resourceEditable: false,
      durationEditable: false,
    });
  });

  it("locates invalid rule configuration", () => {
    const decoded = decodeEditingResult({
      snap: "PT30M",
      startEditable: "yes",
      durationEditable: 1,
      constraint: [{ start: "2026-10-26T10:00Z", end: "2026-10-26T09:00Z" }],
      overlap: "never",
      allow: true,
    });
    expect(Result.isFailure(decoded)).toBe(true);
    if (Result.isFailure(decoded))
      expect(decoded.failure.issues.map((issue) => issue.path.join("."))).toEqual(
        expect.arrayContaining([
          "editing.startEditable",
          "editing.durationEditable",
          "editing.constraint.0.end",
          "editing.overlap",
          "editing.allow",
        ]),
      );
  });
});

describe("evaluateMove capabilities", () => {
  it("is read-only without editing options", () => {
    expect(evaluateMove(timelineOf(), undefined, move({ shift: { slots: 1 } }))).toEqual({
      status: "unavailable",
      reason: "read-only",
    });
  });

  it("is read-only until a capability is enabled", () => {
    const editing = editingOf({ startEditable: false, resourceEditable: false });
    expect(evaluateMove(timelineOf(), editing, move({ shift: { slots: 1 } }))).toEqual({
      status: "unavailable",
      reason: "read-only",
    });
  });

  it("moves time without reassigning when only time movement is enabled", () => {
    const editing = editingOf({ resourceEditable: false });
    const proposal = allowed(
      evaluateMove(
        timelineOf(),
        editing,
        move({ targetResourceId: "room-102", shift: { slots: 1 } }),
      ),
    );
    expect(proposal.after.resourceIds).toEqual(["room-101"]);
    expect(proposal.after.start).toBe("2026-10-26T10:00:00Z");
  });

  it("reassigns without changing time when only resource movement is enabled", () => {
    const editing = editingOf({ startEditable: false });
    const proposal = allowed(
      evaluateMove(
        timelineOf(),
        editing,
        move({ targetResourceId: "room-102", shift: { slots: 3 } }),
      ),
    );
    expect(proposal.after.resourceIds).toEqual(["room-102"]);
    expect(proposal.after.start).toBe("2026-10-26T09:10:00Z");
    expect(proposal.after.end).toBe("2026-10-26T10:20:00Z");
  });

  it("lets an event's own controls override the timeline's, in either direction", () => {
    const timeline = timelineOf({
      events: [
        stay({ id: "emma", startEditable: false }),
        stay({ id: "noah", startEditable: true }),
      ],
    });
    expect(evaluateMove(timeline, editingOf(), move({ shift: { slots: 1 } }))).toMatchObject({
      status: "unchanged",
    });
    const locked = editingOf({ startEditable: false, resourceEditable: false });
    expect(
      allowed(evaluateMove(timeline, locked, move({ eventId: "noah", shift: { slots: 1 } }))).after
        .start,
    ).toBe("2026-10-26T10:00:00Z");
    expect(
      evaluateMove(timeline, locked, move({ eventId: "noah", targetResourceId: "room-102" })),
    ).toMatchObject({ status: "unchanged" });
  });

  it("rejects a request the timeline cannot satisfy", () => {
    const timeline = timelineOf();
    const editing = editingOf();
    expect(evaluateMove(timeline, editing, move({ eventId: "missing" }))).toEqual({
      status: "unavailable",
      reason: "unknown-event",
    });
    expect(evaluateMove(timeline, editing, move({ sourceResourceId: "room-102" }))).toEqual({
      status: "unavailable",
      reason: "unknown-source",
    });
    for (const targetResourceId of ["floor", "room-999"])
      expect(evaluateMove(timeline, editing, move({ targetResourceId }))).toEqual({
        status: "unavailable",
        reason: "invalid-target",
      });
  });
});

describe("evaluateMove time", () => {
  it("snaps the start and preserves the elapsed duration", () => {
    const proposal = allowed(
      evaluateMove(timelineOf(), editingOf(), move({ shift: { slots: 0.25 } })),
    );
    // 09:10 moved by a quarter of an hour is 09:25, which is nearest 09:30.
    expect(proposal.after.start).toBe("2026-10-26T09:30:00Z");
    expect(proposal.after.end).toBe("2026-10-26T10:40:00Z");
    expect(proposal.before).toMatchObject({
      start: "2026-10-26T09:10:00Z",
      end: "2026-10-26T10:20:00Z",
    });
  });

  it("does not round an off-grid event for a gesture that stays in its grid cell", () => {
    for (const slots of [0, 0.03, -0.05, -0.3])
      expect(evaluateMove(timelineOf(), editingOf(), move({ shift: { slots } }))).toMatchObject({
        status: "unchanged",
      });
  });

  it("snaps a start that leaves its grid cell, ties toward the later boundary", () => {
    // 09:10 + 05 minutes is 09:15, exactly between 09:00 and 09:30: the later boundary wins,
    // and it differs from the nearest boundary of the original start, 09:00.
    const proposal = allowed(
      evaluateMove(timelineOf(), editingOf(), move({ shift: { slots: 5 / 60 } })),
    );
    expect(proposal.after.start).toBe("2026-10-26T09:30:00Z");
  });

  it("moves backwards", () => {
    const proposal = allowed(
      evaluateMove(timelineOf(), editingOf(), move({ shift: { slots: -1 } })),
    );
    expect(proposal.after).toMatchObject({
      start: "2026-10-26T08:00:00Z",
      end: "2026-10-26T09:10:00Z",
    });
  });

  it("moves by whole snap steps", () => {
    const proposal = allowed(
      evaluateMove(timelineOf(), editingOf(), move({ shift: { steps: 3 } })),
    );
    // 09:10 + 3 * 30 minutes is 10:40, which is nearest 10:30.
    expect(proposal.after.start).toBe("2026-10-26T10:30:00Z");
    expect(proposal.after.end).toBe("2026-10-26T11:40:00Z");
  });

  it("moves an event that starts before the visible range", () => {
    const timeline = timelineOf({
      events: [stay({ id: "emma", start: "2026-10-25T20:00Z", end: "2026-10-26T04:00Z" })],
    });
    const proposal = allowed(evaluateMove(timeline, editingOf(), move({ shift: { slots: 2 } })));
    expect(proposal.after.start).toBe("2026-10-25T22:00:00Z");
    expect(proposal.after.end).toBe("2026-10-26T06:00:00Z");
  });
});

describe("evaluateMove across daylight saving time", () => {
  // New York leaves daylight saving time at 2026-11-01T06:00Z: 31 October is 24 hours long and
  // 1 November is 25.
  const zoned = (slotDuration: string) =>
    timelineOf({
      range: {
        start: "2026-10-30T00:00[America/New_York]",
        end: "2026-11-03T00:00[America/New_York]",
      },
      slotDuration,
      timeZone: "America/New_York",
      events: [
        stay({ id: "emma", start: "2026-10-31T09:00-04:00", end: "2026-10-31T11:00-04:00" }),
      ],
    });

  it("moves by calendar days when the slot is a day, keeping the local time", () => {
    const proposal = allowed(
      evaluateMove(zoned("P1D"), editingOf({ snap: "PT30M" }), move({ shift: { slots: 1 } })),
    );
    // 09:00 EDT on 31 October to 09:00 EST on 1 November: 25 elapsed hours.
    expect(proposal.after.start).toBe("2026-11-01T14:00:00Z");
    expect(proposal.after.end).toBe("2026-11-01T16:00:00Z");
  });

  it("moves by elapsed time when the slot is an hour", () => {
    const proposal = allowed(
      evaluateMove(zoned("PT1H"), editingOf({ snap: "PT30M" }), move({ shift: { slots: 24 } })),
    );
    // 24 elapsed hours after 09:00 EDT is 08:00 EST.
    expect(proposal.after.start).toBe("2026-11-01T13:00:00Z");
  });

  it("keeps the elapsed duration across the change", () => {
    const timeline = timelineOf({
      range: {
        start: "2026-10-30T00:00[America/New_York]",
        end: "2026-11-03T00:00[America/New_York]",
      },
      slotDuration: "P1D",
      timeZone: "America/New_York",
      events: [
        stay({ id: "emma", start: "2026-10-31T22:00-04:00", end: "2026-11-01T03:00-05:00" }),
      ],
    });
    const proposal = allowed(
      evaluateMove(timeline, editingOf({ snap: "PT30M" }), move({ shift: { slots: 2 } })),
    );
    // The stay lasts six elapsed hours (22:00 EDT to 03:00 EST), and so does its move: two days
    // later is 22:00 EST on 2 November.
    expect(proposal.after.start).toBe("2026-11-03T03:00:00Z");
    expect(proposal.after.end).toBe("2026-11-03T09:00:00Z");
  });

  it("moves a day step by calendar days and an hour step by elapsed hours", () => {
    const byDay = allowed(
      evaluateMove(zoned("PT1H"), editingOf({ snap: "P1D" }), move({ shift: { steps: 1 } })),
    );
    // 09:00 EDT + 1 day is 09:00 EST on 1 November (14:00Z), nearest the midnight before it.
    expect(byDay.after.start).toBe("2026-11-01T04:00:00Z");
    const byHours = allowed(
      evaluateMove(zoned("PT1H"), editingOf({ snap: "PT1H" }), move({ shift: { steps: 24 } })),
    );
    expect(byHours.after.start).toBe("2026-11-01T13:00:00Z");
  });
});

describe("evaluateMove resources", () => {
  const shared = (resourceIds: string[]) =>
    timelineOf({ events: [stay({ id: "emma", resourceIds })] });

  it("changes only the resources when time does not move, keeping off-grid datetimes", () => {
    const proposal = allowed(
      evaluateMove(timelineOf(), editingOf(), move({ targetResourceId: "room-102" })),
    );
    expect(proposal).toMatchObject({
      operation: "move",
      eventId: "emma",
      sourceResourceId: "room-101",
      targetResourceId: "room-102",
      occurrenceId: JSON.stringify(["emma", "room-101"]),
    });
    expect(proposal.after).toMatchObject({
      resourceIds: ["room-102"],
      start: "2026-10-26T09:10:00Z",
      end: "2026-10-26T10:20:00Z",
    });
  });

  it("moves A from A+B to C as B+C", () => {
    const proposal = allowed(
      evaluateMove(
        shared(["room-101", "room-102"]),
        editingOf(),
        move({ targetResourceId: "room-201" }),
      ),
    );
    expect(proposal.before.resourceIds).toEqual(["room-101", "room-102"]);
    expect(proposal.after.resourceIds).toEqual(["room-102", "room-201"]);
  });

  it("moves A onto B as B once", () => {
    const proposal = allowed(
      evaluateMove(
        shared(["room-101", "room-102"]),
        editingOf(),
        move({ targetResourceId: "room-102" }),
      ),
    );
    expect(proposal.after.resourceIds).toEqual(["room-102"]);
  });

  it("changes the shared interval, so every remaining resource gets it", () => {
    const proposal = allowed(
      evaluateMove(
        shared(["room-101", "room-102"]),
        editingOf(),
        move({ targetResourceId: "room-201", shift: { slots: 1 } }),
      ),
    );
    expect(proposal.after).toMatchObject({
      resourceIds: ["room-102", "room-201"],
      start: "2026-10-26T10:00:00Z",
      end: "2026-10-26T11:10:00Z",
    });
  });

  it("identifies the rendering that was dragged", () => {
    const proposal = allowed(
      evaluateMove(
        shared(["room-101", "room-102"]),
        editingOf(),
        move({ sourceResourceId: "room-102", targetResourceId: "room-201" }),
      ),
    );
    expect(proposal.occurrenceId).toBe(JSON.stringify(["emma", "room-102"]));
    expect(proposal.after.resourceIds).toEqual(["room-101", "room-201"]);
  });

  it("is unchanged when nothing moves, and carries the proposal that shows the event staying", () => {
    const evaluation = evaluateMove(timelineOf(), editingOf(), move());
    expect(evaluation).toMatchObject({ status: "unchanged" });
    if (evaluation.status !== "unchanged") throw new Error("expected unchanged");
    expect(evaluation.proposal.after).toEqual(evaluation.proposal.before);
    expect(evaluation.proposal).toMatchObject({
      eventId: "emma",
      sourceResourceId: "room-101",
      targetResourceId: "room-101",
    });
  });

  it("proposes values that can be supplied back as events, with the data and controls kept", () => {
    const timeline = timelineOf({
      events: [stay({ id: "emma", data: { vip: true }, startEditable: true, overlap: false })],
    });
    const { after } = allowed(evaluateMove(timeline, editingOf(), move({ shift: { slots: 1 } })));
    expect(after).toMatchObject({
      id: "emma",
      title: "emma",
      data: { vip: true },
      startEditable: true,
      overlap: false,
    });
    expect(Result.isSuccess(decodeTimelineResult(timelineInput({ events: [after] })))).toBe(true);
  });
});

describe("edit rules", () => {
  const events = [
    stay({ id: "emma", start: "2026-10-26T09:00Z", end: "2026-10-26T10:00Z" }),
    stay({
      id: "other",
      resourceIds: ["room-102"],
      start: "2026-10-26T10:00Z",
      end: "2026-10-26T11:00Z",
    }),
  ];
  const toRoom102 = (shift?: MoveRequest["shift"]) =>
    move({ targetResourceId: "room-102", ...(shift && { shift }) });

  describe("constraint", () => {
    const hours = { start: "2026-10-26T08:00Z", end: "2026-10-26T18:00Z" };

    it("rejects an interval that is not wholly inside the constraint", () => {
      const timeline = timelineOf({ events });
      const editing = editingOf({ constraint: hours });
      expect(evaluateMove(timeline, editing, move({ shift: { slots: 8 } }))).toMatchObject({
        status: "allowed",
      });
      expect(evaluateMove(timeline, editing, move({ shift: { slots: 8.5 } }))).toMatchObject({
        status: "rejected",
        rule: "constraint",
      });
      expect(evaluateMove(timeline, editing, move({ shift: { slots: -1.5 } }))).toMatchObject({
        status: "rejected",
        rule: "constraint",
      });
    });

    it("limits an interval to its resources", () => {
      const timeline = timelineOf({ events });
      const editing = editingOf({ constraint: { ...hours, resourceIds: ["room-102"] } });
      expect(evaluateMove(timeline, editing, toRoom102())).toMatchObject({ status: "allowed" });
      expect(evaluateMove(timeline, editing, move({ shift: { slots: 1 } }))).toMatchObject({
        status: "rejected",
        rule: "constraint",
      });
    });

    it("accepts any interval of a list", () => {
      const timeline = timelineOf({ events });
      const editing = editingOf({
        constraint: [
          { start: "2026-10-26T08:00Z", end: "2026-10-26T12:00Z" },
          { start: "2026-10-26T14:00Z", end: "2026-10-26T18:00Z" },
        ],
      });
      expect(evaluateMove(timeline, editing, move({ shift: { slots: 5 } }))).toMatchObject({
        status: "allowed",
      });
      expect(evaluateMove(timeline, editing, move({ shift: { slots: 3 } }))).toMatchObject({
        status: "rejected",
        rule: "constraint",
      });
    });

    it("applies the event's constraint as well as the timeline's", () => {
      const timeline = timelineOf({
        events: [
          { ...events[0]!, constraint: { start: "2026-10-26T09:00Z", end: "2026-10-26T12:00Z" } },
          events[1]!,
        ],
      });
      const editing = editingOf({ constraint: hours });
      expect(evaluateMove(timeline, editing, move({ shift: { slots: 2 } }))).toMatchObject({
        status: "allowed",
      });
      expect(evaluateMove(timeline, editing, move({ shift: { slots: 3 } }))).toMatchObject({
        status: "rejected",
        rule: "constraint",
      });
    });

    it("checks every resource the proposal is assigned to", () => {
      const timeline = timelineOf({
        events: [{ ...events[0]!, resourceIds: ["room-101", "room-102"] }],
      });
      const editing = editingOf({
        constraint: { ...hours, resourceIds: ["room-102", "room-201"] },
      });
      expect(evaluateMove(timeline, editing, move({ targetResourceId: "room-201" }))).toMatchObject(
        { status: "allowed" },
      );
      expect(evaluateMove(timeline, editing, move({ shift: { slots: 0.5 } }))).toMatchObject({
        status: "rejected",
        rule: "constraint",
      });
    });
  });

  describe("overlap", () => {
    it("treats adjacent events as not overlapping", () => {
      const editing = editingOf({ overlap: () => false });
      const timeline = timelineOf({ events });
      // Room 102's stay ends at 11:00 and starts at 10:00; emma lasts an hour.
      expect(evaluateMove(timeline, editing, toRoom102())).toMatchObject({ status: "allowed" });
      expect(evaluateMove(timeline, editing, toRoom102({ slots: 2 }))).toMatchObject({
        status: "allowed",
      });
      expect(evaluateMove(timeline, editing, toRoom102({ slots: 1 }))).toMatchObject({
        status: "rejected",
        rule: "overlap",
      });
      expect(evaluateMove(timeline, editing, toRoom102({ slots: 0.5 }))).toMatchObject({
        status: "rejected",
        rule: "overlap",
      });
    });

    it("asks the timeline's rule about each overlapping pair, stationary event first", () => {
      const overlap = vi.fn(() => true);
      const timeline = timelineOf({ events });
      const result = evaluateMove(timeline, editingOf({ overlap }), toRoom102({ slots: 1 }));
      expect(result.status).toBe("allowed");
      expect(overlap).toHaveBeenCalledTimes(1);
      const [stationary, moving] = overlap.mock.calls[0] as unknown as [
        { id: string; start: { toString(): string } },
        { id: string; start: { toString(): string }; resourceIds: string[] },
      ];
      expect(stationary.id).toBe("other");
      expect(moving.id).toBe("emma");
      expect(moving.start.toString()).toBe("2026-10-26T10:00:00Z");
      expect(moving.resourceIds).toEqual(["room-102"]);
    });

    it("forbids any overlap when the moving event says false", () => {
      const timeline = timelineOf({ events: [{ ...events[0]!, overlap: false }, events[1]!] });
      expect(evaluateMove(timeline, editingOf(), toRoom102({ slots: 1 }))).toMatchObject({
        status: "rejected",
        rule: "overlap",
      });
    });

    it("forbids any overlap when the stationary event says false", () => {
      const timeline = timelineOf({ events: [events[0]!, { ...events[1]!, overlap: false }] });
      expect(evaluateMove(timeline, editingOf(), toRoom102({ slots: 1 }))).toMatchObject({
        status: "rejected",
        rule: "overlap",
      });
      expect(evaluateMove(timeline, editingOf(), toRoom102({ slots: 2 }))).toMatchObject({
        status: "allowed",
      });
    });

    it("ignores events on other resources", () => {
      const timeline = timelineOf({ events: [events[0]!, { ...events[1]!, overlap: false }] });
      expect(evaluateMove(timeline, editingOf(), move({ shift: { slots: 1 } }))).toMatchObject({
        status: "allowed",
      });
    });

    it("considers every resource the proposal is assigned to", () => {
      const shared = { ...events[0]!, resourceIds: ["room-101", "room-102"] };
      const timeline = timelineOf({ events: [shared, { ...events[1]!, overlap: false }] });
      // Dragging the room 101 rendering to room 201 leaves the event on room 102 and in the way.
      expect(
        evaluateMove(
          timeline,
          editingOf(),
          move({ targetResourceId: "room-201", shift: { slots: 1 } }),
        ),
      ).toMatchObject({ status: "rejected", rule: "overlap" });
      // Dragging the room 102 rendering away takes it out of the way.
      expect(
        evaluateMove(
          timeline,
          editingOf(),
          move({
            sourceResourceId: "room-102",
            targetResourceId: "room-201",
            shift: { slots: 1 },
          }),
        ),
      ).toMatchObject({ status: "allowed" });
    });

    it("does not compare an event with itself", () => {
      const timeline = timelineOf({ events: [{ ...events[0]!, overlap: false }] });
      expect(evaluateMove(timeline, editingOf(), move({ shift: { slots: 0.5 } }))).toMatchObject({
        status: "allowed",
      });
    });
  });

  describe("allow", () => {
    it("receives the proposal that would be emitted and the loaded events", () => {
      const allow = vi.fn(() => true);
      const timeline = timelineOf({ events });
      const result = evaluateMove(timeline, editingOf({ allow }), toRoom102({ slots: 3 }));
      expect(result.status).toBe("allowed");
      expect(allow).toHaveBeenCalledTimes(1);
      const [proposal, context] = allow.mock.calls[0] as unknown as [
        { after: { start: string } },
        { events: { id: string }[] },
      ];
      expect(proposal).toEqual(allowed(result));
      expect(context.events.map((event) => event.id)).toEqual(["emma", "other"]);
    });
  });

  describe("order and failures", () => {
    it("runs constraint, then overlap, then allow, and stops at the first rejection", () => {
      const calls: string[] = [];
      const editing = editingOf({
        constraint: { start: "2026-10-26T08:00Z", end: "2026-10-26T12:00Z" },
        overlap: () => (calls.push("overlap"), false),
        allow: () => (calls.push("allow"), false),
      });
      const timeline = timelineOf({ events });
      expect(evaluateMove(timeline, editing, toRoom102({ slots: 8 }))).toMatchObject({
        rule: "constraint",
      });
      expect(calls).toEqual([]);
      expect(evaluateMove(timeline, editing, toRoom102({ slots: 1 }))).toMatchObject({
        rule: "overlap",
      });
      expect(calls).toEqual(["overlap"]);
      expect(evaluateMove(timeline, editing, toRoom102({ slots: 2 }))).toMatchObject({
        rule: "allow",
      });
      expect(calls).toEqual(["overlap", "allow"]);
    });

    it("rejects with the proposal the preview shows", () => {
      const editing = editingOf({ allow: () => false });
      const timeline = timelineOf({ events });
      const rejected = evaluateMove(timeline, editing, toRoom102({ slots: 3 }));
      const permitted = evaluateMove(timeline, editingOf(), toRoom102({ slots: 3 }));
      expect(rejected.status).toBe("rejected");
      if (rejected.status === "rejected") expect(rejected.proposal).toEqual(allowed(permitted));
    });

    it("rejects, and reports the error, when a rule throws", () => {
      const failure = new Error("rule failed");
      const timeline = timelineOf({ events });
      const throwing = (name: "overlap" | "allow") =>
        editingOf({
          [name]: () => {
            throw failure;
          },
        });
      expect(evaluateMove(timeline, throwing("overlap"), toRoom102({ slots: 1 }))).toMatchObject({
        status: "rejected",
        rule: "overlap",
        error: failure,
      });
      expect(evaluateMove(timeline, throwing("allow"), toRoom102({ slots: 3 }))).toMatchObject({
        status: "rejected",
        rule: "allow",
        error: failure,
      });
    });

    it("does not consult rules for a gesture that changes nothing", () => {
      const allow = vi.fn(() => false);
      expect(
        evaluateMove(
          timelineOf({ events }),
          editingOf({ allow }),
          move({ shift: { slots: 0.01 } }),
        ),
      ).toMatchObject({ status: "unchanged" });
      expect(allow).not.toHaveBeenCalled();
    });

    it("does not reject supplied events for breaking a rule", () => {
      const decoded = decodeTimelineResult(
        timelineInput({
          events: [
            {
              ...events[0]!,
              overlap: false,
              constraint: { start: "2026-10-26T12:00Z", end: "2026-10-26T13:00Z" },
            },
            { ...events[1]!, resourceIds: ["room-101"], start: "2026-10-26T09:30Z" },
          ],
        }),
      );
      expect(Result.isSuccess(decoded)).toBe(true);
      if (Result.isSuccess(decoded))
        expect(
          decoded.success.rows.find((row) => row.resource.id === "room-101")?.placements,
        ).toHaveLength(2);
    });

    it("locates an invalid event constraint", () => {
      const decoded = decodeTimelineResult(
        timelineInput({
          events: [
            {
              ...events[0]!,
              constraint: [{ start: "2026-10-26T12:00Z", end: "2026-10-26T11:00Z" }],
            },
          ],
        }),
      );
      expect(Result.isFailure(decoded)).toBe(true);
      if (Result.isFailure(decoded))
        expect(decoded.failure.issues[0]!.path).toEqual(["events", 0, "constraint", 0, "end"]);
    });
  });
});

describe("evaluateResize capabilities", () => {
  it("is read-only without editing options", () => {
    expect(evaluateResize(timelineOf(), undefined, resize({ shift: { slots: 1 } }))).toEqual({
      status: "unavailable",
      reason: "read-only",
    });
  });

  it("needs its own capability: moving does not enable resizing, nor resizing moving", () => {
    const timeline = timelineOf();
    const moveOnly = editingOf({ durationEditable: false });
    expect(evaluateResize(timeline, moveOnly, resize({ shift: { slots: 1 } }))).toEqual({
      status: "unavailable",
      reason: "read-only",
    });
    const resizeOnly = editingOf({ startEditable: false, resourceEditable: false });
    expect(
      allowed(evaluateResize(timeline, resizeOnly, resize({ shift: { slots: 1 } }))),
    ).toMatchObject({
      operation: "resize",
    });
    expect(evaluateMove(timeline, resizeOnly, move({ shift: { slots: 1 } }))).toEqual({
      status: "unavailable",
      reason: "read-only",
    });
  });

  it("lets an event's own durationEditable override the timeline's, in either direction", () => {
    const timeline = timelineOf({
      events: [
        stay({ id: "emma", durationEditable: false }),
        stay({ id: "noah", durationEditable: true }),
      ],
    });
    expect(evaluateResize(timeline, editingOf(), resize({ shift: { slots: 1 } }))).toEqual({
      status: "unavailable",
      reason: "read-only",
    });
    const locked = editingOf({ durationEditable: false });
    expect(
      allowed(evaluateResize(timeline, locked, resize({ eventId: "noah", shift: { slots: 1 } })))
        .after.end,
    ).toBe("2026-10-26T11:30:00Z");
  });

  it("rejects a request the timeline cannot satisfy", () => {
    const timeline = timelineOf();
    const editing = editingOf();
    expect(evaluateResize(timeline, editing, resize({ eventId: "missing" }))).toEqual({
      status: "unavailable",
      reason: "unknown-event",
    });
    expect(evaluateResize(timeline, editing, resize({ resourceId: "room-102" }))).toEqual({
      status: "unavailable",
      reason: "unknown-source",
    });
  });
});

describe("evaluateResize edges", () => {
  it("snaps the end edge and keeps an off-grid start", () => {
    const proposal = allowed(
      evaluateResize(timelineOf(), editingOf(), resize({ shift: { slots: 0.5 } })),
    );
    // 10:20 extended by half an hour is 10:50, which is nearest 11:00.
    expect(proposal).toMatchObject({
      operation: "resize",
      edge: "end",
      before: { start: "2026-10-26T09:10:00Z", end: "2026-10-26T10:20:00Z" },
      after: { start: "2026-10-26T09:10:00Z", end: "2026-10-26T11:00:00Z" },
    });
  });

  it("snaps the start edge and keeps an off-grid end", () => {
    const proposal = allowed(
      evaluateResize(timelineOf(), editingOf(), resize({ edge: "start", shift: { slots: -0.5 } })),
    );
    // 09:10 brought forward half an hour is 08:40, which is nearest 08:30.
    expect(proposal).toMatchObject({
      operation: "resize",
      edge: "start",
      after: { start: "2026-10-26T08:30:00Z", end: "2026-10-26T10:20:00Z" },
    });
  });

  it("shortens as well as extends", () => {
    const end = allowed(
      evaluateResize(timelineOf(), editingOf(), resize({ shift: { slots: -1 } })),
    );
    expect(end.after).toMatchObject({ start: "2026-10-26T09:10:00Z", end: "2026-10-26T09:30:00Z" });
    const start = allowed(
      evaluateResize(timelineOf(), editingOf(), resize({ edge: "start", shift: { slots: 0.5 } })),
    );
    expect(start.after).toMatchObject({
      start: "2026-10-26T09:30:00Z",
      end: "2026-10-26T10:20:00Z",
    });
  });

  it("resizes by whole snap steps", () => {
    const timeline = timelineOf();
    const editing = editingOf();
    // 10:20 + 2 * 30 minutes is 11:20, which is nearest 11:30.
    expect(
      allowed(evaluateResize(timeline, editing, resize({ shift: { steps: 2 } }))).after.end,
    ).toBe("2026-10-26T11:30:00Z");
    // 09:10 - 30 minutes is 08:40, which is nearest 08:30.
    expect(
      allowed(evaluateResize(timeline, editing, resize({ edge: "start", shift: { steps: -1 } })))
        .after.start,
    ).toBe("2026-10-26T08:30:00Z");
  });

  it("takes the later boundary at a tie", () => {
    // 10:20 + 25 minutes is 10:45, exactly between 10:30 and 11:00.
    const proposal = allowed(
      evaluateResize(timelineOf(), editingOf(), resize({ shift: { slots: 25 / 60 } })),
    );
    expect(proposal.after.end).toBe("2026-10-26T11:00:00Z");
  });

  it("does not round an off-grid event for a gesture that stays in the edge's grid cell", () => {
    for (const slots of [0, 0.05, 0.1, -0.05])
      expect(evaluateResize(timelineOf(), editingOf(), resize({ shift: { slots } }))).toMatchObject(
        { status: "unchanged" },
      );
    for (const slots of [0, 0.03, -0.05, -0.2])
      expect(
        evaluateResize(timelineOf(), editingOf(), resize({ edge: "start", shift: { slots } })),
      ).toMatchObject({ status: "unchanged" });
    expect(evaluateResize(timelineOf(), editingOf(), resize())).toMatchObject({
      status: "unchanged",
    });
  });

  it("carries the proposal that shows the event staying when it is unchanged", () => {
    const evaluation = evaluateResize(timelineOf(), editingOf(), resize({ edge: "start" }));
    if (evaluation.status !== "unchanged") throw new Error("expected unchanged");
    expect(evaluation.proposal.after).toEqual(evaluation.proposal.before);
    expect(evaluation.proposal).toMatchObject({ operation: "resize", edge: "start" });
  });

  it("resizes an event that the range clips, from its true endpoints", () => {
    const timeline = timelineOf({
      events: [stay({ id: "emma", start: "2026-10-25T20:00Z", end: "2026-10-26T04:00Z" })],
    });
    const proposal = allowed(
      evaluateResize(timeline, editingOf(), resize({ shift: { slots: 2 } })),
    );
    expect(proposal.after).toMatchObject({
      start: "2026-10-25T20:00:00Z",
      end: "2026-10-26T06:00:00Z",
    });
    const start = allowed(
      evaluateResize(timeline, editingOf(), resize({ edge: "start", shift: { slots: -2 } })),
    );
    expect(start.after.start).toBe("2026-10-25T18:00:00Z");
  });

  it("snaps to the same grid as movement", () => {
    // `probe` starts where `emma` ends, so moving probe's start and resizing emma's end by the
    // same shift must land on the same boundary; likewise emma's own start.
    const timeline = timelineOf({
      events: [
        stay({ id: "emma" }),
        stay({ id: "probe", start: "2026-10-26T10:20Z", end: "2026-10-26T12:00Z" }),
      ],
    });
    const editing = editingOf();
    let compared = 0;
    for (const slots of [-0.5, -0.07, 0.25, 5 / 60, 0.5]) {
      const movedEmma = evaluateMove(
        timeline,
        editing,
        move({ eventId: "emma", shift: { slots } }),
      );
      const movedProbe = evaluateMove(
        timeline,
        editing,
        move({ eventId: "probe", shift: { slots } }),
      );
      const startEdge = evaluateResize(
        timeline,
        editing,
        resize({ edge: "start", shift: { slots } }),
      );
      const endEdge = evaluateResize(timeline, editing, resize({ shift: { slots } }));
      // A gesture that stays in its cell changes nothing either way.
      expect(startEdge.status).toBe(movedEmma.status);
      if (startEdge.status === "allowed" && movedEmma.status === "allowed") {
        expect(startEdge.proposal.after.start).toBe(movedEmma.proposal.after.start);
        compared += 1;
      }
      expect(endEdge.status).toBe(movedProbe.status);
      if (endEdge.status === "allowed" && movedProbe.status === "allowed") {
        expect(endEdge.proposal.after.end).toBe(movedProbe.proposal.after.start);
        compared += 1;
      }
    }
    expect(compared).toBeGreaterThanOrEqual(6);
  });

  it("is independent of the grid origin: moving the viewport does not shift boundaries", () => {
    const shifted = timelineOf({ range: { start: "2026-10-26T00:07Z", end: "2026-10-27T00:07Z" } });
    const proposal = allowed(
      evaluateResize(shifted, editingOf(), resize({ shift: { slots: 0.5 } })),
    );
    expect(proposal.after.end).toBe("2026-10-26T11:00:00Z");
  });
});

describe("evaluateResize keeps the interval positive", () => {
  const onehour = (overrides: Partial<CalendarEventInput> = {}) =>
    timelineOf({
      events: [
        stay({ id: "emma", start: "2026-10-26T09:00Z", end: "2026-10-26T10:00Z", ...overrides }),
      ],
    });

  it("keeps an end that crosses the start at the first boundary after it", () => {
    const proposal = allowed(
      evaluateResize(timelineOf(), editingOf(), resize({ shift: { slots: -2 } })),
    );
    // 08:20 snaps to 08:30, before the start 09:10: the first boundary after 09:10 is 09:30.
    expect(proposal.after).toMatchObject({
      start: "2026-10-26T09:10:00Z",
      end: "2026-10-26T09:30:00Z",
    });
  });

  it("keeps a start that crosses the end at the last boundary before it", () => {
    const proposal = allowed(
      evaluateResize(timelineOf(), editingOf(), resize({ edge: "start", shift: { slots: 2 } })),
    );
    // 11:10 snaps to 11:00, after the end 10:20: the last boundary before 10:20 is 10:00, which
    // leaves 20 minutes, less than one snap step. No business minimum is added.
    expect(proposal.after).toMatchObject({
      start: "2026-10-26T10:00:00Z",
      end: "2026-10-26T10:20:00Z",
    });
  });

  it("does not let an edge land on the opposite endpoint", () => {
    const timeline = onehour();
    const end = allowed(evaluateResize(timeline, editingOf(), resize({ shift: { slots: -1 } })));
    expect(end.after).toMatchObject({ start: "2026-10-26T09:00:00Z", end: "2026-10-26T09:30:00Z" });
    const start = allowed(
      evaluateResize(timeline, editingOf(), resize({ edge: "start", shift: { slots: 1 } })),
    );
    expect(start.after).toMatchObject({
      start: "2026-10-26T09:30:00Z",
      end: "2026-10-26T10:00:00Z",
    });
  });

  it("stays at the nearest valid boundary however far the edge is dragged", () => {
    const timeline = onehour();
    expect(
      allowed(evaluateResize(timeline, editingOf(), resize({ shift: { slots: -50 } }))).after.end,
    ).toBe("2026-10-26T09:30:00Z");
    expect(
      allowed(
        evaluateResize(timeline, editingOf(), resize({ edge: "start", shift: { slots: 50 } })),
      ).after.start,
    ).toBe("2026-10-26T09:30:00Z");
  });

  it("never moves an edge against the way it was dragged", () => {
    // The only boundaries on the allowed side are 09:00 and 11:00, the wrong way for each drag
    // below, so the edge stays and the interval is unchanged.
    const timeline = timelineOf({
      events: [stay({ id: "emma", start: "2026-10-26T09:50Z", end: "2026-10-26T10:00Z" })],
    });
    const editing = editingOf({ snap: "PT1H" });
    expect(
      evaluateResize(timeline, editing, resize({ edge: "start", shift: { slots: 1 } })),
    ).toMatchObject({ status: "unchanged" });
    expect(evaluateResize(timeline, editing, resize({ shift: { slots: -1 } }))).toMatchObject({
      status: "unchanged",
    });
  });

  it("proposes nothing when the valid boundary is where the edge already is", () => {
    const timeline = onehour({ end: "2026-10-26T09:30Z" });
    expect(evaluateResize(timeline, editingOf(), resize({ shift: { slots: -3 } }))).toMatchObject({
      status: "unchanged",
    });
    expect(
      evaluateResize(timeline, editingOf(), resize({ edge: "start", shift: { slots: 3 } })),
    ).toMatchObject({ status: "unchanged" });
  });

  it("measures the boundary on a coarser grid", () => {
    const timeline = timelineOf({
      slotDuration: "P1D",
      range: { start: "2026-10-26T00:00Z", end: "2026-11-09T00:00Z" },
      events: [stay({ id: "emma", start: "2026-10-27T00:00Z", end: "2026-10-29T00:00Z" })],
    });
    const editing = editingOf({ snap: "P1D" });
    expect(
      allowed(evaluateResize(timeline, editing, resize({ shift: { slots: -5 } }))).after.end,
    ).toBe("2026-10-28T00:00:00Z");
    expect(
      allowed(evaluateResize(timeline, editing, resize({ edge: "start", shift: { slots: 5 } })))
        .after.start,
    ).toBe("2026-10-28T00:00:00Z");
  });
});

describe("evaluateResize across daylight saving time", () => {
  // New York leaves daylight saving time at 2026-11-01T06:00Z: 1 November is 25 hours long.
  const zoned = (slotDuration: string, snap: string) => ({
    timeline: timelineOf({
      range: {
        start: "2026-10-30T00:00[America/New_York]",
        end: "2026-11-04T00:00[America/New_York]",
      },
      timeZone: "America/New_York",
      slotDuration,
      events: [
        stay({
          id: "emma",
          start: "2026-10-31T00:00[America/New_York]",
          end: "2026-11-01T00:00[America/New_York]",
        }),
      ],
    }),
    editing: editingOf({ snap }),
  });

  it("extends by calendar days when the slot is a day", () => {
    const { timeline, editing } = zoned("P1D", "P1D");
    const proposal = allowed(evaluateResize(timeline, editing, resize({ shift: { slots: 1 } })));
    // Midnight 1 November to midnight 2 November is 25 hours.
    expect(proposal.after).toMatchObject({
      start: "2026-10-31T04:00:00Z",
      end: "2026-11-02T05:00:00Z",
    });
  });

  it("extends by elapsed time when the slot is an hour", () => {
    const { timeline, editing } = zoned("PT1H", "PT1H");
    const proposal = allowed(evaluateResize(timeline, editing, resize({ shift: { slots: 25 } })));
    expect(proposal.after.end).toBe("2026-11-02T05:00:00Z");
  });
});

describe("evaluateResize resources", () => {
  const sharedEvent = stay({
    id: "emma",
    resourceIds: ["room-101", "room-102"],
    start: "2026-10-26T09:00Z",
    end: "2026-10-26T10:00Z",
  });

  it("changes the shared interval and leaves the assignments alone", () => {
    const proposal = allowed(
      evaluateResize(
        timelineOf({ events: [sharedEvent] }),
        editingOf(),
        resize({ resourceId: "room-102", shift: { slots: 1 } }),
      ),
    );
    expect(proposal).toMatchObject({
      eventId: "emma",
      occurrenceId: JSON.stringify(["emma", "room-102"]),
      sourceResourceId: "room-102",
      targetResourceId: "room-102",
      before: { resourceIds: ["room-101", "room-102"], end: "2026-10-26T10:00:00Z" },
      after: { resourceIds: ["room-101", "room-102"], end: "2026-10-26T11:00:00Z" },
    });
  });

  it("proposes the same interval whichever rendering is resized", () => {
    const timeline = timelineOf({ events: [sharedEvent] });
    const [a, b] = ["room-101", "room-102"].map((resourceId) =>
      allowed(evaluateResize(timeline, editingOf(), resize({ resourceId, shift: { slots: 1 } }))),
    );
    expect(a!.after).toEqual(b!.after);
  });

  it("proposes values that can be supplied back as events, with the data and controls kept", () => {
    const timeline = timelineOf({
      events: [stay({ id: "emma", data: { vip: true }, durationEditable: true, overlap: false })],
    });
    const proposal = allowed(
      evaluateResize(timeline, editingOf(), resize({ shift: { slots: 1 } })),
    );
    expect(proposal.after).toMatchObject({
      id: "emma",
      data: { vip: true },
      durationEditable: true,
      overlap: false,
    });
    expect(JSON.parse(JSON.stringify(proposal))).toEqual(proposal);
    expect(
      Result.isSuccess(decodeTimelineResult(timelineInput({ events: [proposal.after] }))),
    ).toBe(true);
  });
});

describe("evaluateResize edit rules", () => {
  // `emma` is on both rooms; `other` follows it on room 102.
  const events = [
    stay({
      id: "emma",
      resourceIds: ["room-101", "room-102"],
      start: "2026-10-26T09:00Z",
      end: "2026-10-26T09:30Z",
    }),
    stay({
      id: "other",
      resourceIds: ["room-102"],
      start: "2026-10-26T10:00Z",
      end: "2026-10-26T11:00Z",
    }),
  ];
  const extend = (slots: number) => resize({ shift: { slots } });

  it("treats a boundary shared with another event as no overlap", () => {
    const editing = editingOf({ overlap: () => false });
    // 09:30 + 30 minutes ends as `other` starts.
    expect(evaluateResize(timelineOf({ events }), editing, extend(0.5)).status).toBe("allowed");
    expect(evaluateResize(timelineOf({ events }), editing, extend(1)).status).toBe("rejected");
  });

  it("rejects an interval outside the constraint", () => {
    const editing = editingOf({
      constraint: { start: "2026-10-26T08:00Z", end: "2026-10-26T10:00Z" },
    });
    const timeline = timelineOf({ events });
    expect(evaluateResize(timeline, editing, extend(0.5)).status).toBe("allowed");
    expect(evaluateResize(timeline, editing, extend(1))).toMatchObject({
      status: "rejected",
      rule: "constraint",
    });
    expect(
      evaluateResize(timeline, editing, resize({ edge: "start", shift: { slots: -2 } })),
    ).toMatchObject({ status: "rejected", rule: "constraint" });
  });

  it("gives allow the proposal that would be emitted, and the loaded events", () => {
    const allow = vi.fn(() => true);
    const timeline = timelineOf({ events });
    const proposal = allowed(evaluateResize(timeline, editingOf({ allow }), extend(0.5)));
    expect(allow).toHaveBeenCalledWith(proposal, { events: timeline.events });
    expect(proposal).toMatchObject({ operation: "resize", edge: "end" });
  });

  it("runs constraint, then overlap, then allow, and stops at the first rejection", () => {
    const calls: string[] = [];
    const editing = editingOf({
      constraint: { start: "2026-10-26T08:00Z", end: "2026-10-26T10:30Z" },
      overlap: () => (calls.push("overlap"), false),
      allow: () => (calls.push("allow"), false),
    });
    const timeline = timelineOf({ events });
    expect(evaluateResize(timeline, editing, extend(2))).toMatchObject({ rule: "constraint" });
    expect(calls).toEqual([]);
    expect(evaluateResize(timeline, editing, extend(1))).toMatchObject({ rule: "overlap" });
    expect(calls).toEqual(["overlap"]);
    expect(evaluateResize(timeline, editing, extend(0.5))).toMatchObject({ rule: "allow" });
    expect(calls).toEqual(["overlap", "allow"]);
  });
});

describe("previewLayout", () => {
  const events = [
    stay({ id: "emma", start: "2026-10-26T09:00Z", end: "2026-10-26T10:00Z" }),
    stay({
      id: "other",
      resourceIds: ["room-102"],
      start: "2026-10-26T10:00Z",
      end: "2026-10-26T12:00Z",
    }),
  ];

  const layoutOf = (shift: MoveRequest["shift"], overrides: Partial<MoveRequest> = {}) => {
    const timeline = timelineOf({ events });
    const proposal = allowed(
      evaluateMove(
        timeline,
        editingOf(),
        move({ targetResourceId: "room-102", shift, ...overrides }),
      ),
    );
    return previewLayout(timeline, proposal);
  };

  it("places the preview in the target row at the proposed interval", () => {
    const layout = layoutOf({ slots: 4 });
    expect(layout.resourceId).toBe("room-102");
    expect(layout.preview).toMatchObject({
      resourceId: "room-102",
      occurrenceId: JSON.stringify(["emma", "room-102"]),
      lane: 0,
      offset: 13,
      span: 1,
      startsBefore: false,
      endsAfter: false,
    });
    expect(layout.preview!.event.start.toString()).toBe("2026-10-26T13:00:00Z");
  });

  it("puts an overlapping preview in its own lane and grows the row", () => {
    const layout = layoutOf({ slots: 1.5 });
    expect(layout.preview).toMatchObject({ lane: 1, offset: 10.5 });
    expect(layout.placements.map(({ event, lane }) => [event.id, lane])).toEqual([["other", 0]]);
    expect(layout.laneCount).toBe(2);
  });

  it("leaves out the dragged event's own rendering from the target row", () => {
    const timeline = timelineOf({
      events: [stay({ id: "emma", resourceIds: ["room-101", "room-102"] }), events[1]!],
    });
    const proposal = allowed(
      evaluateMove(
        timeline,
        editingOf(),
        move({ targetResourceId: "room-102", shift: { slots: 6 } }),
      ),
    );
    const layout = previewLayout(timeline, proposal);
    expect(layout.placements.map(({ event }) => event.id)).toEqual(["other"]);
    expect(layout.preview!.event.id).toBe("emma");
  });

  it("clips a preview at the edge of the range", () => {
    expect(layoutOf({ slots: 14.5 }).preview).toMatchObject({
      offset: 23.5,
      span: 0.5,
      startsBefore: false,
      endsAfter: true,
    });
  });

  it("has no preview to show when the proposal lies outside the range", () => {
    const layout = layoutOf({ slots: 15 });
    expect(layout.preview).toBeUndefined();
    expect(layout.placements.map(({ event }) => event.id)).toEqual(["other"]);
  });
});

describe("previewLayout of a resize", () => {
  it("places the preview at the resized interval in the dragged rendering's row", () => {
    const timeline = timelineOf({
      events: [
        stay({ id: "emma" }),
        stay({ id: "noah", start: "2026-10-26T10:30Z", end: "2026-10-26T12:00Z" }),
      ],
    });
    const proposal = allowed(
      evaluateResize(timeline, editingOf(), resize({ shift: { slots: 1 } })),
    );
    const layout = previewLayout(timeline, proposal);
    expect(layout.resourceId).toBe("room-101");
    // 09:10 to 11:30 (10:20 + 1h snaps to 11:30); it overlaps noah, so they take two lanes.
    expect(layout.preview?.offset).toBeCloseTo(9 + 10 / 60);
    expect(layout.preview?.span).toBeCloseTo(11.5 - (9 + 10 / 60));
    expect(layout.laneCount).toBe(2);
    expect(layout.placements.map(({ event }) => event.id)).toEqual(["noah"]);
  });
});
