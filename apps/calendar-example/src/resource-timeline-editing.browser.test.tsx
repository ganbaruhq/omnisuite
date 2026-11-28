import type { CalendarEventInput, EditingInput, EventProposal } from "@omnisuite/calendar-core";
import { ResourceTimeline, useResourceTimeline } from "@omnisuite/calendar-react";
import { act, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";
import { ResourceTimelineExample } from "./resource-timeline-example";
import { flatTimeline, sampleEditing } from "@omnisuite/calendar-sample-data/sample-timeline";
import "./styles.css";

// These tests drive the calendar the way a pointer and a keyboard do, in a real browser, and
// measure rows where they are: the fixture's rows have different heights on purpose.

type Event = CalendarEventInput<{ kind?: string }>;
type Proposal = EventProposal<{ kind?: string }>;

const hourWidth = 50;
const labelWidth = 100;
const resources = [
  { id: "floor", title: "Floor", kind: "group" as const },
  { id: "r1", title: "Room 1", parentId: "floor" },
  { id: "r2", title: "Room 2", parentId: "floor" },
  { id: "r3", title: "Room 3", parentId: "floor" },
];
// Heights differ so that no row is where a uniform grid would put it.
const heights: Record<string, number> = { floor: 30, r1: 40, r2: 90, r3: 55 };

const standup: Event = {
  id: "standup",
  resourceIds: ["r1"],
  title: "Standup",
  start: "2026-10-26T09:10:00Z",
  end: "2026-10-26T10:20:00Z",
};
const review: Event = {
  id: "review",
  resourceIds: ["r2"],
  title: "Review",
  start: "2026-10-26T08:00:00Z",
  end: "2026-10-26T09:00:00Z",
};
const shared: Event = {
  id: "shared",
  resourceIds: ["r1", "r2"],
  title: "Shared",
  start: "2026-10-26T02:00:00Z",
  end: "2026-10-26T03:00:00Z",
};
const events = [standup, review, shared];
const half: EditingInput<{ kind?: string }> = {
  snap: "PT30M",
  startEditable: true,
  resourceEditable: true,
};
const resizable: EditingInput<{ kind?: string }> = { ...half, durationEditable: true };
const handleWidth = 8;

function Fixture({
  events,
  editing,
  onProposal,
  onRuleError,
}: {
  events: readonly Event[];
  editing?: EditingInput<{ kind?: string }>;
  onProposal?: (proposal: Proposal) => void;
  onRuleError?: (error: unknown) => void;
}) {
  const state = useResourceTimeline<unknown, { kind?: string }>({
    range: { start: "2026-10-26T00:00:00Z", end: "2026-10-27T00:00:00Z" },
    slotDuration: "PT1H",
    resources,
    events,
    editing,
    onProposal,
    onRuleError,
  });
  if (state.status === "invalid") return <p role="alert">{state.error.message}</p>;
  const { timeline, visibleRows, collapsedIds, toggleExpanded, editor } = state;
  return (
    <ResourceTimeline.Root timeline={timeline} editor={editor} id="calendar">
      <ResourceTimeline.Status
        style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}
      />
      <ResourceTimeline.Viewport
        aria-label="Timeline"
        style={{ width: 900, height: 400, position: "relative" }}
      >
        {visibleRows.map((row) =>
          row.kind === "group" ? (
            <ResourceTimeline.GroupRow
              key={row.resource.id}
              row={row}
              style={{ display: "flex", height: heights[row.resource.id] }}
            >
              <ResourceTimeline.Disclosure
                row={row}
                expanded={!collapsedIds.has(row.resource.id)}
                onExpandedChange={() => toggleExpanded(row.resource.id)}
              >
                toggle
              </ResourceTimeline.Disclosure>
              <span style={{ width: labelWidth }}>{row.resource.title}</span>
            </ResourceTimeline.GroupRow>
          ) : (
            <ResourceTimeline.ResourceRow
              key={row.resource.id}
              row={row}
              style={{ display: "flex", height: heights[row.resource.id] }}
            >
              <span style={{ width: labelWidth, flexShrink: 0 }}>{row.resource.title}</span>
              <ResourceTimeline.Lane style={{ width: 24 * hourWidth, flexShrink: 0 }}>
                {row.placements.map((placement) => (
                  <ResourceTimeline.Event
                    key={placement.occurrenceId}
                    placement={placement}
                    aria-label={placement.event.title}
                    style={{ background: "#cde", boxSizing: "border-box", border: "1px solid" }}
                  >
                    <ResourceTimeline.ResizeHandle
                      edge="start"
                      style={{ width: handleWidth, background: "#58a" }}
                    />
                    {placement.event.title}
                    <ResourceTimeline.ResizeHandle
                      edge="end"
                      style={{ width: handleWidth, background: "#58a" }}
                    />
                  </ResourceTimeline.Event>
                ))}
                <ResourceTimeline.Preview style={{ background: "#9c9", border: "2px dashed" }} />
              </ResourceTimeline.Lane>
            </ResourceTimeline.ResourceRow>
          ),
        )}
      </ResourceTimeline.Viewport>
    </ResourceTimeline.Root>
  );
}

let root: Root | undefined;
let container: HTMLElement | undefined;
let proposals: Proposal[];
let setEvents: (update: (events: readonly Event[]) => readonly Event[]) => void;
let setEditing: (editing: EditingInput<{ kind?: string }> | undefined) => void;

/** A controlled calendar: it applies each proposal to its events, or ignores it when `accept` is false. */
function Harness({
  initial = events,
  accept = true,
  editing = half,
  onRuleError,
}: {
  initial?: readonly Event[];
  accept?: boolean;
  editing?: EditingInput<{ kind?: string }>;
  onRuleError?: (error: unknown) => void;
}) {
  const [current, set] = useState(initial);
  const [currentEditing, setCurrentEditing] = useState<EditingInput<{ kind?: string }> | undefined>(
    editing,
  );
  setEvents = set;
  setEditing = setCurrentEditing;
  return (
    <Fixture
      events={current}
      editing={currentEditing}
      onRuleError={onRuleError}
      onProposal={(proposal) => {
        proposals.push(proposal);
        if (accept)
          set((all) =>
            all.map((event) => (event.id === proposal.eventId ? proposal.after : event)),
          );
      }}
    />
  );
}

async function render(node: ReactNode) {
  container = document.body.appendChild(document.createElement("div"));
  root = createRoot(container);
  await act(async () => root!.render(node));
}

beforeEach(async () => {
  proposals = [];
  await page.viewport(1280, 900);
});

afterEach(async () => {
  // The viewport belongs to the other test files too, so it goes back to the browser's default.
  await page.viewport(414, 896);
  await act(async () => root?.unmount());
  container?.remove();
  root = undefined;
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const holdTime = 300;

const element = (selector: string) => document.querySelector<HTMLElement>(selector)!;
const occurrence = (eventId: string, resourceId?: string) =>
  [
    ...document.querySelectorAll<HTMLElement>(`[data-timeline-event][data-event-id="${eventId}"]`),
  ].filter(
    (candidate) => !resourceId || candidate.closest(`[data-resource-id="${resourceId}"]`),
  )[0]!;
const row = (id: string) => element(`[data-resource-id="${id}"]`).getBoundingClientRect();
const lane = (id: string) =>
  element(`[data-resource-id="${id}"] [data-timeline-lane]`).getBoundingClientRect();
const calendar = () => element("#calendar");
const viewport = () => element("[data-timeline-viewport]");
const preview = () => document.querySelector<HTMLElement>("[data-timeline-preview]");
const status = () => element("[data-timeline-status]").textContent;

/** The screen position of a time on the lane of a resource, `hours` after midnight, in its row's middle. */
const where = (resourceId: string, hours: number, down = 0.5) => {
  const rowBox = row(resourceId);
  return { x: lane(resourceId).left + hours * hourWidth, y: rowBox.top + rowBox.height * down };
};

function fire(type: string, target: EventTarget, point: { x: number; y: number }) {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
      button: 0,
      buttons: type === "pointerup" ? 0 : 1,
      clientX: point.x,
      clientY: point.y,
    }),
  );
}

/** Presses on an event and holds the pointer still long enough for the drag to begin. */
async function hold(target: Element, point: { x: number; y: number }) {
  await act(async () => {
    fire("pointerdown", target, point);
    await sleep(holdTime);
  });
}
const moveTo = (point: { x: number; y: number }) =>
  act(async () => {
    fire("pointermove", document, point);
    await sleep(30);
  });
const release = (point: { x: number; y: number }) =>
  act(async () => {
    fire("pointerup", document, point);
    await sleep(60);
  });

/** Drags an event from a time on its row to a time on a row, holding first. */
async function drag(
  eventId: string,
  from: { resource: string; hours: number },
  to: { resource: string; hours: number; down?: number },
) {
  const start = where(from.resource, from.hours);
  await hold(occurrence(eventId, from.resource), start);
  await moveTo(where(to.resource, to.hours, to.down));
  return { release: () => release(where(to.resource, to.hours, to.down)) };
}

const extent = (box: DOMRect) => [Math.round(box.left), Math.round(box.right)];

describe("editing", () => {
  it("is read-only unless editing is supplied", async () => {
    await render(<Fixture events={events} />);

    await hold(occurrence("standup"), where("r1", 9.5));
    await moveTo(where("r1", 12));
    expect(calendar().dataset.gesture).toBeUndefined();
    expect(preview()).toBeNull();
    expect(occurrence("standup").tabIndex).toBe(-1);
    await release(where("r1", 12));
    expect(proposals).toEqual([]);
  });

  it("reports an invalid snap step as invalid input", async () => {
    await render(<Fixture events={events} editing={{ snap: "PT0S" }} />);

    expect(document.querySelector("[role=alert]")!.textContent).toMatch(/editing\.snap/);
  });

  it("opens nothing on a click, and does not begin a drag without a hold", async () => {
    const clicked = vi.fn();
    await render(<Harness />);
    occurrence("standup").addEventListener("click", clicked);

    const point = where("r1", 9.5);
    await act(async () => {
      fire("pointerdown", occurrence("standup"), point);
      await sleep(40);
      fire("pointerup", document, point);
      occurrence("standup").click();
    });

    expect(clicked).toHaveBeenCalledOnce();
    expect(calendar().dataset.gesture).toBeUndefined();
    expect(document.querySelector("[role=dialog]")).toBeNull();
    expect(preview()).toBeNull();
    expect(proposals).toEqual([]);
  });

  it("does not begin a drag if the pointer moves before the hold completes", async () => {
    await render(<Harness />);

    const start = where("r1", 9.5);
    await act(async () => {
      fire("pointerdown", occurrence("standup"), start);
      await sleep(30);
      fire("pointermove", document, { x: start.x + 40, y: start.y });
      await sleep(holdTime);
    });
    await moveTo({ x: start.x + 80, y: start.y });
    await release({ x: start.x + 80, y: start.y });

    expect(proposals).toEqual([]);
    expect(preview()).toBeNull();
  });

  it("shows only the destination while dragging, then proposes it on release", async () => {
    await render(<Harness />);
    const original = occurrence("standup").getBoundingClientRect();

    const dragging = await drag(
      "standup",
      { resource: "r1", hours: 9.5 },
      // 20px is 0.4 hours: 09:10 + 24 minutes is 09:34, which is nearest 09:30.
      { resource: "r1", hours: 9.5 + 0.4 },
    );

    expect(calendar().dataset.gesture).toBe("pointer");
    // The original placement is hidden and nothing floats with the pointer.
    const hidden = occurrence("standup");
    expect(hidden.dataset.dragging).toBe("true");
    expect(getComputedStyle(hidden).opacity).toBe("0");
    expect(hidden.getBoundingClientRect().left).toBeCloseTo(original.left, 0);
    // Exactly one preview, on the snapped destination, with its description.
    expect(document.querySelectorAll("[data-timeline-preview]")).toHaveLength(1);
    const box = preview()!.getBoundingClientRect();
    expect(box.left).toBeCloseTo(lane("r1").left + 9.5 * hourWidth, 0);
    expect(box.width).toBeCloseTo((70 / 60) * hourWidth, 0);
    expect(preview()!.getAttribute("aria-label")).toMatch(
      /^Move Standup to Room 1, .*9:30.*to.*10:40/,
    );
    expect(status()).toBe(preview()!.getAttribute("aria-label"));
    expect(preview()!.dataset.status).toBe("allowed");
    expect(proposals).toEqual([]);

    await dragging.release();

    expect(proposals).toHaveLength(1);
    expect(proposals[0]).toMatchObject({
      operation: "move",
      eventId: "standup",
      sourceResourceId: "r1",
      targetResourceId: "r1",
      before: { start: "2026-10-26T09:10:00Z", end: "2026-10-26T10:20:00Z" },
      after: { start: "2026-10-26T09:30:00Z", end: "2026-10-26T10:40:00Z" },
    });
    expect(calendar().dataset.gesture).toBeUndefined();
    expect(preview()).toBeNull();
    expect(occurrence("standup").dataset.dragging).toBeUndefined();
    // The application accepted it, so the event is where it was proposed.
    expect(occurrence("standup").getBoundingClientRect().left).toBeCloseTo(
      lane("r1").left + 9.5 * hourWidth,
      0,
    );
  });

  it("leaves the event where it was when the application does not accept the proposal", async () => {
    await render(<Harness accept={false} />);
    const original = occurrence("standup").getBoundingClientRect();

    const dragging = await drag(
      "standup",
      { resource: "r1", hours: 9.5 },
      { resource: "r1", hours: 12 },
    );
    await dragging.release();

    expect(proposals).toHaveLength(1);
    expect(extent(occurrence("standup").getBoundingClientRect())).toEqual(extent(original));
    expect(preview()).toBeNull();
  });

  it("does not round an event the gesture did not move", async () => {
    await render(<Harness />);

    const dragging = await drag(
      "standup",
      { resource: "r1", hours: 9.5 },
      { resource: "r1", hours: 9.5 + 0.04 },
    );
    // Inside the cell the start already snaps to, the preview shows the event as it is.
    expect(preview()!.dataset.status).toBe("unchanged");
    expect(preview()!.getBoundingClientRect().left).toBeCloseTo(
      lane("r1").left + (9 + 10 / 60) * hourWidth,
      0,
    );
    await dragging.release();

    expect(proposals).toEqual([]);
    expect(occurrence("standup").getBoundingClientRect().left).toBeCloseTo(
      lane("r1").left + (9 + 10 / 60) * hourWidth,
      0,
    );
  });

  it("moves an event to the row under the pointer, using the rows' measured positions", async () => {
    await render(<Harness />);
    // The rows really are different heights, and a group heading sits above them.
    expect(row("r1").height).toBe(40);
    expect(row("r2").height).toBe(90);
    expect(row("r3").height).toBe(55);

    const dragging = await drag(
      "standup",
      { resource: "r1", hours: 9.5 },
      { resource: "r3", hours: 9.5, down: 0.9 },
    );
    expect(preview()!.closest("[data-resource-id]")!.getAttribute("data-resource-id")).toBe("r3");
    await dragging.release();

    expect(proposals[0]).toMatchObject({
      sourceResourceId: "r1",
      targetResourceId: "r3",
      after: { resourceIds: ["r3"], start: "2026-10-26T09:10:00Z" },
    });
  });

  it("targets the row at either edge of a tall row, and not its neighbours", async () => {
    await render(<Harness />);
    const middle = row("r2");

    for (const [y, target] of [
      [middle.top + 1, "r2"],
      [middle.bottom - 1, "r2"],
      [middle.bottom + 1, "r3"],
      [middle.top - 1, "r1"],
    ] as const) {
      await hold(occurrence("standup"), where("r1", 9.5));
      await moveTo({ x: where("r1", 9.5).x, y });
      expect(preview()!.closest("[data-resource-id]")!.getAttribute("data-resource-id")).toBe(
        target,
      );
      await userEvent.keyboard("{Escape}");
      await act(async () => sleep(30));
      expect(preview()).toBeNull();
    }
  });

  it("does not treat a group heading, or a collapsed row, as a destination", async () => {
    await render(<Harness />);

    // The group heading is above the rooms.
    await hold(occurrence("standup"), where("r1", 9.5));
    const heading = element('[data-group-id="floor"]').getBoundingClientRect();
    await moveTo({ x: lane("r1").left + 9.5 * hourWidth, y: heading.top + heading.height / 2 });
    expect(preview()).toBeNull();
    expect(status()).toMatch(/not over a resource/);
    await release({ x: lane("r1").left + 9.5 * hourWidth, y: heading.top + heading.height / 2 });
    expect(proposals).toEqual([]);
    expect(calendar().dataset.cancelReason).toBe("invalid-target");
    expect(occurrence("standup").dataset.dragging).toBeUndefined();

    // Collapsing the group removes its rooms, so none is left to be a destination.
    await page.getByRole("button", { name: /Collapse Floor/ }).click();
    expect(document.querySelectorAll("[data-resource-id]")).toHaveLength(0);
  });

  it("cancels, emitting nothing, when released outside the timeline", async () => {
    await render(<Harness />);

    await hold(occurrence("standup"), where("r1", 9.5));
    await moveTo({ x: where("r1", 9.5).x, y: viewport().getBoundingClientRect().bottom + 50 });
    expect(preview()).toBeNull();
    await release({ x: where("r1", 9.5).x, y: viewport().getBoundingClientRect().bottom + 50 });

    expect(proposals).toEqual([]);
    expect(calendar().dataset.cancelReason).toBe("invalid-target");
    expect(status()).toMatch(/cancelled/);
    expect(calendar().dataset.gesture).toBeUndefined();
  });

  it("cancels on Escape and does not propose when the pointer is then released", async () => {
    await render(<Harness />);

    const dragging = await drag(
      "standup",
      { resource: "r1", hours: 9.5 },
      { resource: "r1", hours: 12 },
    );
    expect(preview()).not.toBeNull();
    await userEvent.keyboard("{Escape}");
    await act(async () => sleep(30));

    expect(preview()).toBeNull();
    expect(calendar().dataset.gesture).toBeUndefined();
    expect(calendar().dataset.cancelReason).toBe("escape");
    await dragging.release();
    expect(proposals).toEqual([]);
    expect(occurrence("standup").dataset.dragging).toBeUndefined();
  });

  describe("shared events", () => {
    it("moves A onto B as B once, and a shared time change moves every rendering", async () => {
      await render(<Harness />);

      // One hour later as well: 02:00 becomes 04:00.
      const dragging = await drag(
        "shared",
        { resource: "r1", hours: 2.5 },
        { resource: "r2", hours: 4.5 },
      );
      expect(preview()!.closest("[data-resource-id]")!.getAttribute("data-resource-id")).toBe("r2");
      await dragging.release();

      expect(proposals[0]).toMatchObject({
        after: { resourceIds: ["r2"], start: "2026-10-26T04:00:00Z", end: "2026-10-26T05:00:00Z" },
      });
      expect(document.querySelectorAll('[data-event-id="shared"]')).toHaveLength(1);

      // Moving it in time only, from A, moves the rendering under B as well.
      await act(async () => setEvents(() => events));
      const timeOnly = await drag(
        "shared",
        { resource: "r1", hours: 2.5 },
        { resource: "r1", hours: 5.5 },
      );
      await timeOnly.release();
      const left = lane("r1").left + 5 * hourWidth;
      expect(occurrence("shared", "r1").getBoundingClientRect().left).toBeCloseTo(left, 0);
      expect(occurrence("shared", "r2").getBoundingClientRect().left).toBeCloseTo(
        lane("r2").left + 5 * hourWidth,
        0,
      );
    });
  });

  describe("rules", () => {
    const stayAfter: Event = {
      id: "after",
      resourceIds: ["r1"],
      title: "After",
      start: "2026-10-26T11:00:00Z",
      end: "2026-10-26T12:00:00Z",
    };

    it("shows a rejected destination as not allowed and emits nothing when it is released", async () => {
      const overlap = vi.fn(() => false);
      await render(<Harness initial={[standup, stayAfter]} editing={{ ...half, overlap }} />);

      // Moving Standup onto After's hour on the same room.
      const dragging = await drag(
        "standup",
        { resource: "r1", hours: 9.5 },
        { resource: "r1", hours: 11.5 },
      );

      const shown = preview()!;
      expect(shown.dataset.status).toBe("rejected");
      expect(shown.dataset.notAllowed).toBe("true");
      expect(shown.dataset.rule).toBe("overlap");
      expect(shown.getAttribute("aria-label")).toMatch(/^Not allowed: Standup/);
      expect(status()).toBe(shown.getAttribute("aria-label"));
      // The rule saw the same proposal the preview shows.
      expect(overlap).toHaveBeenCalled();

      await dragging.release();

      expect(proposals).toEqual([]);
      expect(calendar().dataset.cancelReason).toBe("rejected");
      expect(occurrence("standup").getBoundingClientRect().left).toBeCloseTo(
        lane("r1").left + (9 + 10 / 60) * hourWidth,
        0,
      );
    });

    it("evaluates the constraint, overlap and allow rules in that order", async () => {
      const calls: string[] = [];
      const blocker: Event = {
        id: "blocker",
        resourceIds: ["r1"],
        title: "Blocker",
        start: "2026-10-26T11:30:00Z",
        end: "2026-10-26T13:00:00Z",
      };
      await render(
        <Harness
          initial={[standup, blocker]}
          editing={{
            ...half,
            constraint: { start: "2026-10-26T06:00:00Z", end: "2026-10-26T20:00:00Z" },
            overlap: () => (calls.push("overlap"), true),
            allow: () => (calls.push("allow"), true),
          }}
        />,
      );

      // Inside the constraint, the later rules both run, in order.
      const inside = await drag(
        "standup",
        { resource: "r1", hours: 9.5 },
        { resource: "r1", hours: 12 },
      );
      expect(calls.slice(0, 2)).toEqual(["overlap", "allow"]);
      await inside.release();
      calls.length = 0;

      // Outside the constraint it is rejected before the other rules are asked.
      const outside = await drag(
        "standup",
        { resource: "r1", hours: 12 },
        { resource: "r1", hours: 2 },
      );
      expect(preview()!.dataset.rule).toBe("constraint");
      expect(calls).toEqual([]);
      await outside.release();
      expect(proposals).toHaveLength(1);
    });

    it("rejects, and reports once, a rule that throws", async () => {
      const failure = new Error("rule is broken");
      const onRuleError = vi.fn();
      await render(
        <Harness
          editing={{
            ...half,
            allow: () => {
              throw failure;
            },
          }}
          onRuleError={onRuleError}
        />,
      );

      const dragging = await drag(
        "standup",
        { resource: "r1", hours: 9.5 },
        { resource: "r1", hours: 12 },
      );
      await moveTo(where("r1", 12.5));
      expect(preview()!.dataset.status).toBe("rejected");
      expect(preview()!.dataset.notAllowed).toBe("true");
      await dragging.release();

      expect(proposals).toEqual([]);
      expect(onRuleError).toHaveBeenCalledOnce();
      expect(onRuleError).toHaveBeenCalledWith(failure, expect.objectContaining({ rule: "allow" }));
    });

    it("never rejects the events it is given", async () => {
      await render(
        <Harness
          initial={[
            standup,
            stayAfter,
            { ...review, resourceIds: ["r1"], start: standup.start, end: standup.end },
          ]}
          editing={{ ...half, overlap: () => false, allow: () => false }}
        />,
      );

      expect(document.querySelectorAll("[data-timeline-event]")).toHaveLength(3);
      expect(document.querySelector("[data-not-allowed]")).toBeNull();
    });
  });

  describe("per-event controls", () => {
    it("lets an event override the calendar's capabilities", async () => {
      await render(
        <Harness
          initial={[
            { ...standup, startEditable: false },
            { ...review, startEditable: true, resourceEditable: false },
          ]}
          editing={{ ...half, startEditable: false }}
        />,
      );

      // Standup may only change rooms; its time is pinned.
      const dragging = await drag(
        "standup",
        { resource: "r1", hours: 9.5 },
        { resource: "r3", hours: 12 },
      );
      await dragging.release();
      expect(proposals[0]).toMatchObject({
        after: { resourceIds: ["r3"], start: "2026-10-26T09:10:00Z" },
      });

      // Review may change time but, with resources not editable, stays in its room.
      proposals.length = 0;
      const timeOnly = await drag(
        "review",
        { resource: "r2", hours: 8.5 },
        { resource: "r1", hours: 11.5 },
      );
      await timeOnly.release();
      expect(proposals[0]).toMatchObject({
        after: { resourceIds: ["r2"], start: "2026-10-26T11:00:00Z" },
      });
    });
  });

  describe("external changes", () => {
    it("cancels when the dragged event is removed", async () => {
      await render(<Harness />);

      const dragging = await drag(
        "standup",
        { resource: "r1", hours: 9.5 },
        { resource: "r1", hours: 12 },
      );
      await act(async () => setEvents((all) => all.filter((event) => event.id !== "standup")));

      expect(calendar().dataset.gesture).toBeUndefined();
      expect(calendar().dataset.cancelReason).toBe("event-removed");
      expect(preview()).toBeNull();
      await dragging.release();
      expect(proposals).toEqual([]);
    });

    it("cancels when the dragged event is changed under the gesture", async () => {
      await render(<Harness />);

      const dragging = await drag(
        "standup",
        { resource: "r1", hours: 9.5 },
        { resource: "r1", hours: 12 },
      );
      await act(async () =>
        setEvents((all) =>
          all.map((event) =>
            event.id === "standup" ? { ...event, end: "2026-10-26T11:00:00Z" } : event,
          ),
        ),
      );

      expect(calendar().dataset.cancelReason).toBe("event-changed");
      await dragging.release();
      expect(proposals).toEqual([]);
    });

    it("cancels, and can start again, when editing is turned off under the gesture", async () => {
      await render(<Harness />);

      const dragging = await drag(
        "standup",
        { resource: "r1", hours: 9.5 },
        { resource: "r1", hours: 12 },
      );
      await act(async () => setEditing(undefined));

      expect(calendar().dataset.gesture).toBeUndefined();
      expect(preview()).toBeNull();
      await dragging.release();
      expect(proposals).toEqual([]);

      await act(async () => setEditing(half));
      // Removing the drag provider ends dnd-kit's drag first, so this may be named an escape.
      expect(calendar().dataset.cancelReason).toBeDefined();
      // dnd-kit registers the new draggables a frame later.
      await act(async () => sleep(100));
      const again = await drag(
        "standup",
        { resource: "r1", hours: 9.5 },
        { resource: "r1", hours: 12 },
      );
      await again.release();
      expect(proposals).toHaveLength(1);
    });

    it("emits what the events are at confirmation when they change under a keyboard move", async () => {
      await render(<Harness />);
      occurrence("standup").focus();

      await userEvent.keyboard("{Enter}{ArrowRight}");
      await act(async () =>
        setEvents((all) =>
          all.map((event) =>
            event.id === "standup" ? { ...event, data: { kind: "changed" } } : event,
          ),
        ),
      );
      await userEvent.keyboard("{Enter}");

      expect(proposals[0]!.after.data).toEqual({ kind: "changed" });
    });

    it("keeps dragging when the events are supplied again with the same values", async () => {
      await render(<Harness />);

      const dragging = await drag(
        "standup",
        { resource: "r1", hours: 9.5 },
        { resource: "r1", hours: 12 },
      );
      await act(async () => setEvents((all) => all.map((event) => ({ ...event }))));

      expect(calendar().dataset.gesture).toBe("pointer");
      await dragging.release();
      expect(proposals).toHaveLength(1);
    });

    it("works out the destination again when another event changes under the gesture", async () => {
      await render(
        <Harness initial={[standup, review]} editing={{ ...half, overlap: () => false }} />,
      );

      const dragging = await drag(
        "standup",
        { resource: "r1", hours: 9.5 },
        { resource: "r1", hours: 12 },
      );
      expect(preview()!.dataset.status).toBe("allowed");
      // Another event arrives where the standup would land.
      await act(async () =>
        setEvents((all) => [
          ...all,
          {
            id: "late",
            resourceIds: ["r1"],
            title: "Late",
            start: "2026-10-26T11:30:00Z",
            end: "2026-10-26T14:00:00Z",
          },
        ]),
      );

      expect(preview()!.dataset.status).toBe("rejected");
      await dragging.release();
      expect(proposals).toEqual([]);
    });
  });

  it("follows the pointer through a scroll with the pointer still", async () => {
    await render(<Harness />);

    await hold(occurrence("standup"), where("r1", 9.5));
    const still = where("r1", 9.5);
    await moveTo(still);
    const before = preview()!.getBoundingClientRect().left;
    // Scrolling 100px (two hours) carries the lane under a pointer that has not moved.
    await act(async () => {
      viewport().scrollLeft += 100;
      await sleep(60);
    });

    // Relative to the lane the pointer is two hours later: 09:10 + 2h is 11:10, nearest 11:00.
    expect(before).toBeCloseTo(lane("r1").left + 100 + (9 + 10 / 60) * hourWidth, 0);
    expect(preview()!.dataset.status).toBe("allowed");
    expect(preview()!.getBoundingClientRect().left).toBeCloseTo(
      lane("r1").left + 11 * hourWidth,
      0,
    );
    await release(still);
    expect(proposals[0]).toMatchObject({
      after: { start: "2026-10-26T11:00:00Z", end: "2026-10-26T12:10:00Z" },
    });
  });

  describe("keyboard", () => {
    it("moves by a snap step and a row, then drops on Enter", async () => {
      await render(<Harness />);
      const occurrenceFocus = occurrence("standup");
      occurrenceFocus.focus();
      expect(occurrenceFocus.tabIndex).toBe(0);

      await userEvent.keyboard("{Enter}");
      expect(calendar().dataset.gesture).toBe("keyboard");
      await userEvent.keyboard("{ArrowRight}{ArrowRight}");
      // 09:10 + two half-hours is 10:10, which snaps to 10:00.
      expect(preview()!.getBoundingClientRect().left).toBeCloseTo(
        lane("r1").left + 10 * hourWidth,
        0,
      );
      await userEvent.keyboard("{ArrowDown}");
      expect(preview()!.closest("[data-resource-id]")!.getAttribute("data-resource-id")).toBe("r2");
      expect(status()).toMatch(/^Move Standup to Room 2/);
      expect(proposals).toEqual([]);

      await userEvent.keyboard("{Enter}");

      expect(proposals).toHaveLength(1);
      expect(proposals[0]).toMatchObject({
        sourceResourceId: "r1",
        targetResourceId: "r2",
        after: { resourceIds: ["r2"], start: "2026-10-26T10:00:00Z", end: "2026-10-26T11:10:00Z" },
      });
      // Focus stays on the moved event, which is now a different rendering.
      expect((document.activeElement as HTMLElement).dataset.occurrenceId).toBe(
        occurrence("standup", "r2").dataset.occurrenceId,
      );
      expect(calendar().dataset.gesture).toBeUndefined();
    });

    it("keeps focus where it was when the application ignores the proposal", async () => {
      await render(<Harness accept={false} />);
      occurrence("standup").focus();

      await userEvent.keyboard("{Enter}{ArrowRight}{ArrowRight}{Enter}");

      expect(proposals).toHaveLength(1);
      expect(document.activeElement).toBe(occurrence("standup"));
    });

    it("cancels on Escape, and moves back with the opposite arrows", async () => {
      await render(<Harness />);
      occurrence("standup").focus();

      await userEvent.keyboard("{Enter}{ArrowLeft}{ArrowLeft}{ArrowUp}");
      // The first row cannot go up: the group heading is not a destination.
      expect(preview()!.closest("[data-resource-id]")!.getAttribute("data-resource-id")).toBe("r1");
      await userEvent.keyboard("{Escape}");

      expect(calendar().dataset.gesture).toBeUndefined();
      expect(calendar().dataset.cancelReason).toBe("escape");
      expect(proposals).toEqual([]);
      expect(preview()).toBeNull();
    });

    it("cancels when focus leaves the event", async () => {
      await render(<Harness />);
      occurrence("standup").focus();

      await userEvent.keyboard("{Enter}{ArrowRight}");
      await userEvent.tab();

      expect(calendar().dataset.cancelReason).toBe("blur");
      expect(proposals).toEqual([]);
    });

    it("does not move to a rejected destination", async () => {
      await render(<Harness editing={{ ...half, allow: () => false }} />);
      occurrence("standup").focus();

      await userEvent.keyboard("{Enter}{ArrowRight}");
      expect(preview()!.dataset.status).toBe("rejected");
      expect(status()).toMatch(/^Not allowed/);
      await userEvent.keyboard("{Enter}");

      expect(proposals).toEqual([]);
      expect(calendar().dataset.cancelReason).toBe("rejected");
    });

    it("leaves keys to the application when it prevents the default", async () => {
      await render(<Harness />);
      occurrence("standup").addEventListener("keydown", (event) => event.preventDefault(), {
        capture: true,
      });
      occurrence("standup").focus();

      await userEvent.keyboard("{Enter}");

      expect(calendar().dataset.gesture).toBeUndefined();
    });
  });

  describe("cleanup", () => {
    it("leaves nothing behind when unmounted during a drag", async () => {
      await render(<Harness />);
      await drag("standup", { resource: "r1", hours: 9.5 }, { resource: "r1", hours: 12 });
      expect(calendar().dataset.gesture).toBe("pointer");

      const point = where("r1", 12);
      await act(async () => root!.unmount());
      root = undefined;
      container!.remove();
      container = undefined;
      await release(point);

      expect(document.querySelector("[data-timeline-root]")).toBeNull();
      expect(document.body.style.cursor).toBe("");
      expect(proposals).toEqual([]);
    });
  });

  it("keeps two calendars' gestures apart", async () => {
    container = document.body.appendChild(document.createElement("div"));
    root = createRoot(container);
    await act(async () =>
      root!.render(
        <>
          <div id="first">
            <Harness />
          </div>
          <div id="second">
            <Harness />
          </div>
        </>,
      ),
    );
    const roots = document.querySelectorAll<HTMLElement>("[data-timeline-root]");
    expect(roots).toHaveLength(2);
    const [first, second] = roots;

    const target = first!.querySelector<HTMLElement>('[data-event-id="standup"]')!;
    const laneBox = first!
      .querySelector('[data-resource-id="r1"] [data-timeline-lane]')!
      .getBoundingClientRect();
    const rowBox = first!.querySelector('[data-resource-id="r1"]')!.getBoundingClientRect();
    const point = { x: laneBox.left + 9.5 * hourWidth, y: rowBox.top + rowBox.height / 2 };
    await hold(target, point);
    await moveTo({ x: point.x + 150, y: point.y });
    expect(first!.dataset.gesture).toBe("pointer");
    expect(second!.dataset.gesture).toBeUndefined();
    expect(first!.querySelectorAll("[data-timeline-preview]")).toHaveLength(1);
    expect(second!.querySelectorAll("[data-timeline-preview]")).toHaveLength(0);
    expect(second!.querySelector("[data-dragging]")).toBeNull();
    await release({ x: point.x + 150, y: point.y });
    expect(proposals).toHaveLength(1);
  });
});

describe("resizing", () => {
  const handle = (eventId: string, edge: "start" | "end", resourceId?: string) =>
    occurrence(eventId, resourceId).querySelector<HTMLElement>(
      `[data-timeline-resize-handle][data-edge="${edge}"]`,
    );
  const handles = () => document.querySelectorAll("[data-timeline-resize-handle]");
  const at = (box: DOMRect) => ({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
  /** Presses an event's handle at once, with no hold, and returns where the pointer is. */
  async function grab(eventId: string, edge: "start" | "end", resourceId?: string) {
    const point = at(handle(eventId, edge, resourceId)!.getBoundingClientRect());
    await act(async () => {
      fire("pointerdown", handle(eventId, edge, resourceId)!, point);
      await sleep(30);
    });
    return point;
  }
  /** Drags an edge by hours of time along the axis, and down by `down` pixels. */
  async function dragEdge(
    eventId: string,
    edge: "start" | "end",
    hours: number,
    { resourceId, down = 0 }: { resourceId?: string; down?: number } = {},
  ) {
    const from = await grab(eventId, edge, resourceId);
    const to = { x: from.x + hours * hourWidth, y: from.y + down };
    await moveTo(to);
    return { release: () => release(to), to };
  }
  const clock = (resourceId: string, hours: number) => lane(resourceId).left + hours * hourWidth;
  const stay = (instant: number) => instant + 10 / 60;

  describe("handles", () => {
    it("are absent until resizing is enabled, and moving does not enable them", async () => {
      await render(<Harness editing={half} />);

      expect(handles()).toHaveLength(0);
      expect(occurrence("standup").dataset.resizable).toBeUndefined();
      expect(occurrence("standup").dataset.movable).toBe("true");
    });

    it("appear at both edges of every resizable event", async () => {
      await render(<Harness editing={resizable} />);

      // standup (r1), review (r2), and shared under r1 and r2.
      expect(handles()).toHaveLength(8);
      const box = occurrence("standup").getBoundingClientRect();
      expect(handle("standup", "start")!.getBoundingClientRect().left).toBeCloseTo(box.left + 1, 0);
      expect(handle("standup", "end")!.getBoundingClientRect().right).toBeCloseTo(box.right - 1, 0);
      expect(handle("standup", "end")!.getAttribute("aria-hidden")).toBe("true");
      expect(handle("standup", "end")!.tabIndex).toBe(-1);
    });

    it("follow an event's own capability in either direction", async () => {
      await render(
        <Harness
          initial={[
            { ...standup, durationEditable: false },
            { ...review, durationEditable: true },
          ]}
          editing={resizable}
        />,
      );
      expect(handles()).toHaveLength(2);
      expect(handle("standup", "end")).toBeNull();
      expect(handle("review", "end")).not.toBeNull();

      await act(async () => setEditing({ ...half, durationEditable: false }));
      expect(handles()).toHaveLength(2);
      expect(handle("review", "start")).not.toBeNull();
      expect(occurrence("standup").dataset.resizable).toBeUndefined();
    });

    it("are drawn only at an event's actual endpoints, not where the range clips it", async () => {
      const before: Event = {
        id: "before",
        resourceIds: ["r1"],
        title: "Before",
        start: "2026-10-25T20:00:00Z",
        end: "2026-10-26T04:00:00Z",
      };
      const after: Event = {
        id: "after",
        resourceIds: ["r2"],
        title: "After",
        start: "2026-10-26T20:00:00Z",
        end: "2026-10-27T04:00:00Z",
      };
      const whole: Event = {
        id: "whole",
        resourceIds: ["r3"],
        title: "Whole",
        start: "2026-10-25T20:00:00Z",
        end: "2026-10-27T04:00:00Z",
      };
      const flush: Event = {
        id: "flush",
        resourceIds: ["r3"],
        title: "Flush",
        start: "2026-10-26T00:00:00Z",
        end: "2026-10-27T00:00:00Z",
      };
      await render(<Harness initial={[before, after, whole, flush]} editing={resizable} />);

      expect(handle("before", "start")).toBeNull();
      expect(handle("before", "end")).not.toBeNull();
      expect(handle("after", "start")).not.toBeNull();
      expect(handle("after", "end")).toBeNull();
      expect(handle("whole", "start")).toBeNull();
      expect(handle("whole", "end")).toBeNull();
      // Ending exactly where the range ends is an actual endpoint.
      expect(handle("flush", "start")).not.toBeNull();
      expect(handle("flush", "end")).not.toBeNull();
    });
  });

  describe("pointer", () => {
    it("resizes the end edge at once, snapped, and proposes it on release", async () => {
      await render(<Harness editing={resizable} />);
      const original = occurrence("standup").getBoundingClientRect();

      // Half an hour later than 10:20 is 10:50, which is nearest 11:00.
      const dragging = await dragEdge("standup", "end", 0.5);

      expect(calendar().dataset.gesture).toBe("pointer");
      expect(calendar().dataset.operation).toBe("resize");
      // The accepted rendering is hidden but not changed, and only the preview is drawn.
      const hidden = occurrence("standup");
      expect(hidden.dataset.dragging).toBe("true");
      expect(getComputedStyle(hidden).opacity).toBe("0");
      expect(extent(hidden.getBoundingClientRect())).toEqual(extent(original));
      expect(document.querySelectorAll("[data-timeline-preview]")).toHaveLength(1);
      const box = preview()!.getBoundingClientRect();
      expect(box.left).toBeCloseTo(clock("r1", stay(9)), 0);
      expect(box.right).toBeCloseTo(clock("r1", 11), 0);
      expect(preview()!.getAttribute("aria-label")).toMatch(
        /^Resize the end of Standup on Room 1, .*9:10.*to.*11:00/,
      );
      expect(status()).toBe(preview()!.getAttribute("aria-label"));
      expect(proposals).toEqual([]);

      // Holding the pointer past the move hold does not start a move as well.
      await act(async () => sleep(holdTime));
      expect(calendar().dataset.operation).toBe("resize");

      await dragging.release();

      expect(proposals).toHaveLength(1);
      expect(proposals[0]).toMatchObject({
        operation: "resize",
        edge: "end",
        eventId: "standup",
        sourceResourceId: "r1",
        targetResourceId: "r1",
        before: { start: "2026-10-26T09:10:00Z", end: "2026-10-26T10:20:00Z" },
        // The opposite edge stays off-grid.
        after: { start: "2026-10-26T09:10:00Z", end: "2026-10-26T11:00:00Z", resourceIds: ["r1"] },
      });
      expect(calendar().dataset.gesture).toBeUndefined();
      expect(preview()).toBeNull();
      expect(occurrence("standup").dataset.dragging).toBeUndefined();
      const resized = occurrence("standup").getBoundingClientRect();
      expect(resized.left).toBeCloseTo(clock("r1", stay(9)), 0);
      expect(resized.right).toBeCloseTo(clock("r1", 11), 0);
    });

    it("resizes the start edge and keeps the off-grid end", async () => {
      await render(<Harness editing={resizable} />);

      // Half an hour earlier than 09:10 is 08:40, which is nearest 08:30.
      const dragging = await dragEdge("standup", "start", -0.5);
      expect(preview()!.getBoundingClientRect().left).toBeCloseTo(clock("r1", 8.5), 0);
      expect(preview()!.getBoundingClientRect().right).toBeCloseTo(clock("r1", 10 + 20 / 60), 0);
      await dragging.release();

      expect(proposals[0]).toMatchObject({
        operation: "resize",
        edge: "start",
        after: { start: "2026-10-26T08:30:00Z", end: "2026-10-26T10:20:00Z" },
      });
    });

    it("shortens an event", async () => {
      await render(<Harness editing={resizable} />);

      const dragging = await dragEdge("standup", "end", -0.5);
      await dragging.release();

      // 10:20 less half an hour is 09:50, which is nearest 10:00.
      expect(proposals[0]!.after.end).toBe("2026-10-26T10:00:00Z");
    });

    it("leaves the event where it was when the application does not accept the proposal", async () => {
      await render(<Harness editing={resizable} accept={false} />);
      const original = occurrence("standup").getBoundingClientRect();

      const dragging = await dragEdge("standup", "end", 2);
      await dragging.release();

      expect(proposals).toHaveLength(1);
      expect(extent(occurrence("standup").getBoundingClientRect())).toEqual(extent(original));
      expect(preview()).toBeNull();
    });

    it("does not round an event the gesture did not resize", async () => {
      await render(<Harness editing={resizable} />);
      const original = occurrence("standup").getBoundingClientRect();

      // Inside the cell the end already snaps to, the preview shows the event as it is.
      const dragging = await dragEdge("standup", "end", 0.05);
      expect(preview()!.dataset.status).toBe("unchanged");
      expect(preview()!.getBoundingClientRect().right).toBeCloseTo(clock("r1", 10 + 20 / 60), 0);
      await dragging.release();

      expect(proposals).toEqual([]);
      expect(status()).toBe("Standup was not resized.");
      expect(extent(occurrence("standup").getBoundingClientRect())).toEqual(extent(original));
    });

    it("follows the pointer along the axis wherever it is vertically", async () => {
      await render(<Harness editing={resizable} />);

      // Review is in the tall Room 2; the pointer crosses into Room 3 without changing the row.
      const dragging = await dragEdge("review", "end", 1, { down: row("r3").top - row("r2").top });
      expect(preview()!.closest("[data-resource-id]")!.getAttribute("data-resource-id")).toBe("r2");
      await dragging.release();

      expect(proposals[0]).toMatchObject({
        sourceResourceId: "r2",
        targetResourceId: "r2",
        after: { resourceIds: ["r2"], end: "2026-10-26T10:00:00Z" },
      });
    });

    it("follows the pointer through a scroll with the pointer still", async () => {
      await render(<Harness editing={resizable} />);

      const dragging = await dragEdge("standup", "end", 0);
      // Scrolling 100px (two hours) carries the lane under a pointer that has not moved.
      await act(async () => {
        viewport().scrollLeft += 100;
        await sleep(60);
      });

      // 10:20 + 2h is 12:20, nearest 12:30.
      expect(preview()!.getBoundingClientRect().right).toBeCloseTo(clock("r1", 12.5), 0);
      await dragging.release();
      expect(proposals[0]!.after.end).toBe("2026-10-26T12:30:00Z");
    });

    it("cancels on Escape, emitting nothing, and ignores the release that follows", async () => {
      await render(<Harness editing={resizable} />);

      const dragging = await dragEdge("standup", "end", 1);
      await userEvent.keyboard("{Escape}");

      expect(calendar().dataset.gesture).toBeUndefined();
      expect(calendar().dataset.cancelReason).toBe("escape");
      expect(preview()).toBeNull();
      expect(occurrence("standup").dataset.dragging).toBeUndefined();
      expect(status()).toBe("Resize cancelled.");
      await dragging.release();
      expect(proposals).toEqual([]);
    });

    it("moves nothing when the press is not on a handle's primary button", async () => {
      await render(<Harness editing={resizable} />);

      const point = at(handle("standup", "end")!.getBoundingClientRect());
      await act(async () => {
        handle("standup", "end")!.dispatchEvent(
          new PointerEvent("pointerdown", {
            bubbles: true,
            cancelable: true,
            pointerId: 1,
            isPrimary: true,
            button: 2,
            clientX: point.x,
            clientY: point.y,
          }),
        );
        await sleep(30);
      });

      expect(calendar().dataset.gesture).toBeUndefined();
    });

    it("leaves nothing behind when unmounted during a resize", async () => {
      await render(<Harness editing={resizable} />);
      const dragging = await dragEdge("standup", "end", 1);
      expect(calendar().dataset.gesture).toBe("pointer");

      await act(async () => root!.unmount());
      root = undefined;
      container!.remove();
      container = undefined;
      await release(dragging.to);

      expect(document.querySelector("[data-timeline-root]")).toBeNull();
      expect(proposals).toEqual([]);
    });

    it("does not begin a resize while another gesture is under way", async () => {
      await render(<Harness editing={resizable} />);
      await hold(occurrence("standup"), where("r1", 9.5));
      expect(calendar().dataset.operation).toBe("move");

      await grab("review", "end");

      expect(calendar().dataset.operation).toBe("move");
      await release(where("r1", 9.5));
    });
  });

  describe("shared events", () => {
    it("changes the shared interval without changing the assignments, in every rendering", async () => {
      await render(<Harness editing={resizable} />);

      // Resize the Room 2 rendering of an event on Rooms 1 and 2: 03:00 + 1h is 04:00.
      const dragging = await dragEdge("shared", "end", 1, { resourceId: "r2" });
      // Only the dragged rendering has a preview; the other keeps the accepted interval.
      expect(preview()!.closest("[data-resource-id]")!.getAttribute("data-resource-id")).toBe("r2");
      expect(occurrence("shared", "r1").getBoundingClientRect().right).toBeCloseTo(
        clock("r1", 3),
        0,
      );
      await dragging.release();

      expect(proposals).toHaveLength(1);
      expect(proposals[0]).toMatchObject({
        operation: "resize",
        occurrenceId: JSON.stringify(["shared", "r2"]),
        sourceResourceId: "r2",
        after: { resourceIds: ["r1", "r2"], end: "2026-10-26T04:00:00Z" },
      });
      for (const resourceId of ["r1", "r2"])
        expect(occurrence("shared", resourceId).getBoundingClientRect().right).toBeCloseTo(
          clock(resourceId, 4),
          0,
        );
    });
  });

  describe("rules", () => {
    it("shows a rejected interval as not allowed and emits nothing when it is released", async () => {
      await render(<Harness editing={{ ...resizable, allow: () => false }} />);

      const dragging = await dragEdge("standup", "end", 1);

      expect(preview()!.dataset.status).toBe("rejected");
      expect(preview()!.dataset.notAllowed).toBe("true");
      expect(preview()!.dataset.rule).toBe("allow");
      expect(preview()!.getAttribute("aria-label")).toMatch(
        /^Not allowed: Standup on Room 1, .*9:10.*to.*11:30.* \(not permitted\)/,
      );
      expect(status()).toBe(preview()!.getAttribute("aria-label"));
      await dragging.release();

      expect(proposals).toEqual([]);
      expect(calendar().dataset.cancelReason).toBe("rejected");
      expect(status()).toBe("Resize cancelled: that interval is not allowed.");
    });

    it("lets an interval through that the rules allow", async () => {
      await render(<Harness editing={{ ...resizable, allow: () => true }} />);

      const dragging = await dragEdge("standup", "end", 1);
      expect(preview()!.dataset.status).toBe("allowed");
      await dragging.release();

      expect(proposals).toHaveLength(1);
    });
  });

  describe("external changes", () => {
    it("cancels when editing is turned off under the gesture", async () => {
      await render(<Harness editing={resizable} />);

      const dragging = await dragEdge("standup", "end", 1);
      await act(async () => setEditing(undefined));

      expect(calendar().dataset.gesture).toBeUndefined();
      expect(preview()).toBeNull();
      await dragging.release();
      expect(proposals).toEqual([]);
    });

    it("cancels when only resizing is turned off under the gesture", async () => {
      await render(<Harness editing={resizable} />);

      const dragging = await dragEdge("standup", "end", 1);
      await act(async () => setEditing(half));

      // The drag can no longer be resolved, so releasing it proposes nothing.
      await dragging.release();
      expect(proposals).toEqual([]);
      expect(handles()).toHaveLength(0);
    });
  });

  describe("keyboard", () => {
    const tiny: Event = {
      id: "tiny",
      resourceIds: ["r3"],
      title: "Tiny",
      start: "2026-10-26T12:00:00Z",
      end: "2026-10-26T12:05:00Z",
    };

    it("resizes the end edge with Shift and the arrows, then proposes it on Enter", async () => {
      await render(<Harness editing={resizable} />);
      occurrence("standup").focus();

      await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}");
      expect(calendar().dataset.gesture).toBe("keyboard");
      expect(calendar().dataset.operation).toBe("resize");
      // 10:20 + 30 minutes is 10:50, which snaps to 11:00.
      expect(preview()!.getBoundingClientRect().right).toBeCloseTo(clock("r1", 11), 0);
      expect(status()).toMatch(/^Resize the end of Standup on Room 1, .*9:10.*to.*11:00/);
      // The edge goes on moving without the modifier, by a step from where it started each time.
      await userEvent.keyboard("{ArrowRight}");
      expect(preview()!.getBoundingClientRect().right).toBeCloseTo(clock("r1", 11.5), 0);
      await userEvent.keyboard("{ArrowLeft}");
      expect(preview()!.getBoundingClientRect().right).toBeCloseTo(clock("r1", 11), 0);
      // A resize keeps its row.
      await userEvent.keyboard("{ArrowDown}");
      expect(preview()!.closest("[data-resource-id]")!.getAttribute("data-resource-id")).toBe("r1");
      expect(proposals).toEqual([]);

      await userEvent.keyboard("{Enter}");

      expect(proposals).toHaveLength(1);
      expect(proposals[0]).toMatchObject({
        operation: "resize",
        edge: "end",
        after: { start: "2026-10-26T09:10:00Z", end: "2026-10-26T11:00:00Z" },
      });
      expect(calendar().dataset.gesture).toBeUndefined();
      // Focus stays on the event, which is the same rendering.
      expect(document.activeElement).toBe(occurrence("standup"));
    });

    it("resizes the start edge with Alt and the arrows", async () => {
      await render(<Harness editing={resizable} />);
      occurrence("standup").focus();

      await userEvent.keyboard("{Alt>}{ArrowLeft}{/Alt}");
      // 09:10 - 30 minutes is 08:40, which snaps to 08:30.
      expect(preview()!.getBoundingClientRect().left).toBeCloseTo(clock("r1", 8.5), 0);
      await userEvent.keyboard(" ");

      expect(proposals[0]).toMatchObject({
        edge: "start",
        after: { start: "2026-10-26T08:30:00Z", end: "2026-10-26T10:20:00Z" },
      });
    });

    it("resizes an event too narrow for a handle", async () => {
      await render(<Harness initial={[tiny]} editing={resizable} />);
      expect(occurrence("tiny").getBoundingClientRect().width).toBeLessThan(handleWidth);
      occurrence("tiny").focus();

      await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}{Enter}");

      // 12:05 + 30 minutes is 12:35, which snaps to 12:30.
      expect(proposals[0]!.after).toMatchObject({
        start: "2026-10-26T12:00:00Z",
        end: "2026-10-26T12:30:00Z",
      });
    });

    it("cancels on Escape, and cancels when focus leaves the event", async () => {
      await render(<Harness editing={resizable} />);
      occurrence("standup").focus();

      await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}{Escape}");
      expect(calendar().dataset.gesture).toBeUndefined();
      expect(calendar().dataset.cancelReason).toBe("escape");
      expect(status()).toBe("Resize cancelled.");
      expect(preview()).toBeNull();

      await userEvent.keyboard("{Alt>}{ArrowLeft}{/Alt}");
      await userEvent.tab();
      expect(calendar().dataset.cancelReason).toBe("blur");
      expect(proposals).toEqual([]);
    });

    it("does not resize without a modifier, with resizing off, or at a clipped edge", async () => {
      const before: Event = {
        id: "before",
        resourceIds: ["r3"],
        title: "Before",
        start: "2026-10-25T20:00:00Z",
        end: "2026-10-26T04:00:00Z",
      };
      await render(<Harness initial={[standup, before]} editing={resizable} />);

      occurrence("standup").focus();
      await userEvent.keyboard("{ArrowRight}");
      expect(calendar().dataset.gesture).toBeUndefined();

      occurrence("before").focus();
      await userEvent.keyboard("{Alt>}{ArrowLeft}{/Alt}");
      expect(calendar().dataset.gesture).toBeUndefined();
      await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}");
      expect(calendar().dataset.gesture).toBe("keyboard");
      await userEvent.keyboard("{Escape}");

      await act(async () => setEditing(half));
      occurrence("standup").focus();
      await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}");
      expect(calendar().dataset.gesture).toBeUndefined();
    });

    it("names the keys it answers to", async () => {
      const before: Event = {
        id: "before",
        resourceIds: ["r3"],
        title: "Before",
        start: "2026-10-25T20:00:00Z",
        end: "2026-10-26T04:00:00Z",
      };
      await render(<Harness initial={[standup, before]} editing={resizable} />);

      expect(occurrence("standup").getAttribute("aria-keyshortcuts")).toBe(
        "Enter Space Alt+ArrowLeft Alt+ArrowRight Shift+ArrowLeft Shift+ArrowRight",
      );
      expect(occurrence("before").getAttribute("aria-keyshortcuts")).toBe(
        "Enter Space Shift+ArrowLeft Shift+ArrowRight",
      );
    });

    it("does not move to a rejected interval", async () => {
      await render(<Harness editing={{ ...resizable, allow: () => false }} />);
      occurrence("standup").focus();

      await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}");
      expect(preview()!.dataset.status).toBe("rejected");
      expect(status()).toMatch(/^Not allowed/);
      await userEvent.keyboard("{Enter}");

      expect(proposals).toEqual([]);
      expect(calendar().dataset.cancelReason).toBe("rejected");
    });

    it("resizes an event that can only be resized, and leaves Enter alone", async () => {
      await render(<Harness editing={{ snap: "PT30M", durationEditable: true }} />);
      expect(occurrence("standup").dataset.movable).toBeUndefined();
      expect(occurrence("standup").dataset.editable).toBe("");
      occurrence("standup").focus();

      await userEvent.keyboard("{Enter}");
      expect(calendar().dataset.gesture).toBeUndefined();
      await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}{Enter}");
      expect(proposals).toHaveLength(1);
    });
  });
});

describe("the example", () => {
  it("can be edited, with its own rule that two stays cannot share a room", async () => {
    const proposed: unknown[] = [];
    await render(
      <ResourceTimelineExample
        input={flatTimeline}
        editing={sampleEditing}
        onProposal={(proposal) => proposed.push(proposal)}
      />,
    );
    await expect.element(page.getByText("Editable")).toBeVisible();

    // Noah starts as Emma ends in Room 101; moving him a day earlier would overlap her stay.
    const noah = element('[data-event-id="noah"]');
    const bounds = noah.closest("[data-timeline-lane]")!.getBoundingClientRect();
    const middle = {
      x: noah.getBoundingClientRect().left + 30,
      y: noah.getBoundingClientRect().top + 10,
    };
    await hold(noah, middle);
    await moveTo({ x: middle.x - bounds.width / 7, y: middle.y });

    expect(preview()!.dataset.notAllowed).toBe("true");
    await release({ x: middle.x - bounds.width / 7, y: middle.y });
    expect(proposed).toEqual([]);

    // A day later is free.
    await hold(noah, middle);
    await moveTo({ x: middle.x + bounds.width / 7, y: middle.y });
    expect(preview()!.dataset.status).toBe("allowed");
    await release({ x: middle.x + bounds.width / 7, y: middle.y });
    expect(proposed).toHaveLength(1);
  });
});
