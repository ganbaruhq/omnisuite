import { Effect, Exit, Result } from "effect";
import { describe, expect, it } from "vite-plus/test";
import {
  decodeTimeline,
  decodeTimelineResult,
  TimelineInputError,
  type TimelineInput,
} from "./index.js";

const day = (overrides: Partial<TimelineInput> = {}): TimelineInput => ({
  range: { start: "2026-10-26T00:00:00Z", end: "2026-10-27T00:00:00Z" },
  slotDuration: "PT1H",
  resources: [
    { id: "room-101", title: "Room 101" },
    { id: "room-102", title: "Room 102" },
  ],
  events: [],
  ...overrides,
});
const event = (
  id: string,
  start: string,
  end: string,
  resourceIds: string | readonly string[] = "room-101",
) => ({
  id,
  resourceIds: typeof resourceIds === "string" ? [resourceIds] : resourceIds,
  title: id,
  start,
  end,
});

const timelineOf = (input: unknown) => {
  const result = decodeTimelineResult(input);
  if (Result.isFailure(result)) throw new Error(result.failure.message);
  return result.success;
};
const issuesOf = (input: unknown) => {
  const result = decodeTimelineResult(input);
  if (Result.isSuccess(result)) throw new Error("Expected the input to be rejected");
  return result.failure.issues;
};
const placementsOf = (input: TimelineInput, resourceId = "room-101") =>
  timelineOf(input)
    .rows.find((row) => row.resource.id === resourceId)!
    .placements.map(({ event, offset, span, startsBefore, endsAfter }) => ({
      id: event.id,
      offset,
      span,
      startsBefore,
      endsAfter,
    }));

describe("decodeTimeline", () => {
  it("is a lazy Effect that succeeds with the timeline or fails with TimelineInputError", async () => {
    const valid = decodeTimeline(day());
    const invalid = decodeTimeline(day({ slotDuration: "PT0S" }));

    const timeline = await Effect.runPromise(valid);
    expect(timeline.slots).toHaveLength(24);

    const exit = await Effect.runPromiseExit(invalid);
    expect(Exit.isFailure(exit)).toBe(true);
    const failure = await Effect.runPromise(Effect.flip(invalid));
    expect(failure).toBeInstanceOf(TimelineInputError);
    expect(failure._tag).toBe("TimelineInputError");
  });
});

describe("slots", () => {
  it("divides the visible range into slots measured in slot units", () => {
    const { slots, span } = timelineOf(day());
    expect(span).toBe(24);
    expect(slots[0]).toMatchObject({ offset: 0, span: 1 });
    expect(slots[0]!.start.toString()).toBe("2026-10-26T00:00:00+00:00[UTC]");
    expect(slots[23]!.end.toString()).toBe("2026-10-27T00:00:00+00:00[UTC]");
  });

  it("clips the last slot at the end of the range", () => {
    const { slots, span } = timelineOf(
      day({
        range: { start: "2026-10-26T00:00Z", end: "2026-10-26T10:00Z" },
        slotDuration: "PT3H",
      }),
    );
    expect(slots.map((slot) => [slot.offset, slot.span])).toEqual([
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1 / 3],
    ]);
    expect(span).toBeCloseTo(3 + 1 / 3);
    expect(slots[3]!.end.toString()).toBe("2026-10-26T10:00:00+00:00[UTC]");
  });

  it("adds calendar units from the start of the range rather than from the previous slot", () => {
    const { slots } = timelineOf(
      day({ range: { start: "2026-01-31T00:00Z", end: "2026-04-30T00:00Z" }, slotDuration: "P1M" }),
    );
    expect(slots.map((slot) => slot.start.toPlainDate().toString())).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
    ]);
  });
});

describe("placements", () => {
  it("places an event by the slots its endpoints fall in", () => {
    expect(
      placementsOf(day({ events: [event("stay", "2026-10-26T09:30Z", "2026-10-26T11:00Z")] })),
    ).toEqual([{ id: "stay", offset: 9.5, span: 1.5, startsBefore: false, endsAfter: false }]);
  });

  it("lets adjacent events share a boundary without overlapping", () => {
    const placements = placementsOf(
      day({
        events: [
          event("second", "2026-10-26T12:00Z", "2026-10-26T14:00Z"),
          event("first", "2026-10-26T09:00Z", "2026-10-26T12:00Z"),
        ],
      }),
    );
    expect(placements.map(({ id }) => id)).toEqual(["first", "second"]);
    expect(placements[0]!.offset + placements[0]!.span).toBe(12);
    expect(placements[1]!.offset).toBe(12);
  });

  it("orders a resource's events by start and then by ID", () => {
    const placements = placementsOf(
      day({
        events: [
          event("c", "2026-10-26T10:00Z", "2026-10-26T11:00Z"),
          event("b", "2026-10-26T09:00Z", "2026-10-26T10:00Z"),
          event("a", "2026-10-26T10:00Z", "2026-10-26T12:00Z"),
        ],
      }),
    );
    expect(placements.map(({ id }) => id)).toEqual(["b", "a", "c"]);
  });

  it("clips events at the edges of the range and keeps their true endpoints", () => {
    const input = day({
      events: [
        event("overnight", "2026-10-25T20:00Z", "2026-10-26T03:00Z"),
        event("checkout", "2026-10-26T22:00Z", "2026-10-27T05:00Z"),
        event("whole", "2026-10-20T00:00Z", "2026-11-01T00:00Z", "room-102"),
      ],
    });
    expect(placementsOf(input)).toEqual([
      { id: "overnight", offset: 0, span: 3, startsBefore: true, endsAfter: false },
      { id: "checkout", offset: 22, span: 2, startsBefore: false, endsAfter: true },
    ]);
    expect(placementsOf(input, "room-102")).toEqual([
      { id: "whole", offset: 0, span: 24, startsBefore: true, endsAfter: true },
    ]);
    const overnight = timelineOf(input).rows[0]!.placements[0]!.event;
    expect(overnight.start.toString()).toBe("2026-10-25T20:00:00Z");
  });

  it("leaves out events that end at the start of the range or start at its end", () => {
    expect(
      placementsOf(
        day({
          events: [
            event("before", "2026-10-25T20:00Z", "2026-10-26T00:00Z"),
            event("after", "2026-10-27T00:00Z", "2026-10-27T02:00Z"),
          ],
        }),
      ),
    ).toEqual([]);
  });

  it("keeps events for resources that are not loaded without adding a row for them", () => {
    const timeline = timelineOf(
      day({ events: [event("elsewhere", "2026-10-26T09:00Z", "2026-10-26T10:00Z", "room-999")] }),
    );
    expect(timeline.rows.map((row) => row.resource.id)).toEqual(["room-101", "room-102"]);
    expect(timeline.rows.flatMap((row) => row.placements)).toEqual([]);
    expect(timeline.events.map(({ id, resourceIds }) => ({ id, resourceIds }))).toEqual([
      { id: "elsewhere", resourceIds: ["room-999"] },
    ]);
  });

  it("passes consumer data through untouched", () => {
    const guest = { name: "Emma", nights: [1, 2] };
    const timeline = timelineOf(
      day({
        resources: [{ id: "room-101", title: "Room 101", data: { floor: 1 } }],
        events: [{ ...event("stay", "2026-10-26T09:00Z", "2026-10-26T10:00Z"), data: guest }],
      }),
    );
    expect(timeline.rows[0]!.resource.data).toEqual({ floor: 1 });
    expect(timeline.rows[0]!.placements[0]!.event.data).toBe(guest);
  });
});

describe("shared events", () => {
  const shared = event("training", "2026-10-26T09:00Z", "2026-10-26T11:00Z", [
    "room-101",
    "room-102",
  ]);

  it("shows one event under each assigned resource with a distinct occurrence identity", () => {
    const timeline = timelineOf(day({ events: [shared] }));
    const [first, second] = timeline.rows.flatMap((row) => row.placements);

    expect(timeline.rows.map((row) => row.placements.length)).toEqual([1, 1]);
    expect([first!.resourceId, second!.resourceId]).toEqual(["room-101", "room-102"]);
    expect(first!.occurrenceId).not.toBe(second!.occurrenceId);
    // One authoritative event backs every occurrence, so its data is never copied.
    expect(first!.event).toBe(second!.event);
    expect(timeline.events).toHaveLength(1);
    expect(timeline.events[0]).toBe(first!.event);
    expect(first!.event.resourceIds).toEqual(["room-101", "room-102"]);
  });

  it("keeps occurrence identities distinct even when IDs contain separators", () => {
    const timeline = timelineOf(
      day({
        resources: [
          { id: "b:c", title: "One" },
          { id: "c", title: "Two" },
        ],
        events: [
          event("a", "2026-10-26T09:00Z", "2026-10-26T10:00Z", "b:c"),
          event("a:b", "2026-10-26T09:00Z", "2026-10-26T10:00Z", "c"),
        ],
      }),
    );
    const ids = timeline.rows.flatMap((row) => row.placements.map((p) => p.occurrenceId));
    expect(new Set(ids).size).toBe(2);
  });

  it("gives every occurrence the shared interval", () => {
    const timeline = timelineOf(day({ events: [shared] }));
    const [first, second] = timeline.rows.flatMap((row) => row.placements);
    expect(first).toMatchObject({ offset: 9, span: 2, startsBefore: false, endsAfter: false });
    expect(second).toMatchObject({ offset: 9, span: 2, startsBefore: false, endsAfter: false });
  });

  it("keeps assignments to resources that are not loaded without adding rows", () => {
    const timeline = timelineOf(
      day({
        events: [
          event("training", "2026-10-26T09:00Z", "2026-10-26T11:00Z", ["room-101", "room-999"]),
        ],
      }),
    );
    expect(timeline.rows.map((row) => row.resource.id)).toEqual(["room-101", "room-102"]);
    expect(timeline.rows.flatMap((row) => row.placements.map((p) => p.resourceId))).toEqual([
      "room-101",
    ]);
    expect(timeline.events[0]!.resourceIds).toEqual(["room-101", "room-999"]);
  });

  it("accepts an assignment that names no known node, but rejects a group", () => {
    const resources = [
      { id: "floor-1", title: "Floor 1", kind: "group" as const },
      { id: "room-101", title: "Room 101", parentId: "floor-1" },
    ];
    const assigned = (resourceId: string) =>
      day({
        resources,
        events: [event("e", "2026-10-26T09:00Z", "2026-10-26T10:00Z", resourceId)],
      });
    expect(timelineOf(assigned("room-999")).rows.flatMap((row) => row.placements)).toEqual([]);
    expect(issuesOf(assigned("floor-1"))).toEqual([
      { path: ["events", 0, "resourceIds", 0], message: expect.stringContaining("floor-1") },
    ]);
  });
});

describe("lanes", () => {
  const lanesOf = (input: TimelineInput, resourceId = "room-101") =>
    timelineOf(input)
      .rows.find((row) => row.resource.id === resourceId)!
      .placements.map((placement) => [placement.event.id, placement.lane]);
  const rowOf = (input: TimelineInput, resourceId = "room-101") => {
    const row = timelineOf(input).rows.find((row) => row.resource.id === resourceId)!;
    if (row.kind !== "resource") throw new Error(`${resourceId} is not a resource`);
    return row;
  };

  it("puts overlapping events in separate lanes and grows the row to hold them", () => {
    const input = day({
      events: [
        event("a", "2026-10-26T09:00Z", "2026-10-26T12:00Z"),
        event("b", "2026-10-26T10:00Z", "2026-10-26T13:00Z"),
        event("c", "2026-10-26T11:00Z", "2026-10-26T11:30Z"),
      ],
    });
    expect(lanesOf(input)).toEqual([
      ["a", 0],
      ["b", 1],
      ["c", 2],
    ]);
    expect(rowOf(input).laneCount).toBe(3);
  });

  it("lets adjacent events share a lane and reuses the first lane that is free", () => {
    const input = day({
      events: [
        event("a", "2026-10-26T09:00Z", "2026-10-26T12:00Z"),
        event("b", "2026-10-26T10:00Z", "2026-10-26T11:00Z"),
        event("c", "2026-10-26T11:00Z", "2026-10-26T12:30Z"),
        event("d", "2026-10-26T12:00Z", "2026-10-26T13:00Z"),
      ],
    });
    expect(lanesOf(input)).toEqual([
      ["a", 0],
      ["b", 1],
      ["c", 1],
      ["d", 0],
    ]);
    expect(rowOf(input).laneCount).toBe(2);
  });

  it("assigns lanes the same way whatever the input order, breaking ties by ID", () => {
    const events = [
      event("z", "2026-10-26T09:00Z", "2026-10-26T10:00Z"),
      event("m", "2026-10-26T09:00Z", "2026-10-26T10:00Z"),
      event("a", "2026-10-26T09:00Z", "2026-10-26T10:00Z"),
    ];
    const expected = [
      ["a", 0],
      ["m", 1],
      ["z", 2],
    ];
    expect(lanesOf(day({ events }))).toEqual(expected);
    expect(lanesOf(day({ events: [...events].reverse() }))).toEqual(expected);
  });

  it("gives a row with no events one lane", () => {
    expect(rowOf(day(), "room-102").laneCount).toBe(1);
  });

  it("lays out each resource's lanes on its own", () => {
    const input = day({
      events: [
        event("a", "2026-10-26T09:00Z", "2026-10-26T12:00Z", "room-101"),
        event("shared", "2026-10-26T10:00Z", "2026-10-26T11:00Z", ["room-101", "room-102"]),
      ],
    });
    expect(lanesOf(input, "room-101")).toEqual([
      ["a", 0],
      ["shared", 1],
    ]);
    expect(lanesOf(input, "room-102")).toEqual([["shared", 0]]);
    expect(rowOf(input, "room-102").laneCount).toBe(1);
  });

  it("lays out clipped events by their true endpoints", () => {
    const input = day({
      events: [
        // Both are clipped to the whole range, but one ends before the other starts.
        event("early", "2026-10-25T00:00Z", "2026-10-26T10:00Z"),
        event("late", "2026-10-26T10:00Z", "2026-10-28T00:00Z"),
      ],
    });
    expect(lanesOf(input)).toEqual([
      ["early", 0],
      ["late", 0],
    ]);
    expect(
      placementsOf(input).map(({ startsBefore, endsAfter }) => [startsBefore, endsAfter]),
    ).toEqual([
      [true, false],
      [false, true],
    ]);
  });
});

describe("datetime endpoints", () => {
  it("accepts an offset or a named time zone and normalizes both to the same instant", () => {
    const timeline = timelineOf(
      day({
        events: [
          event("offset", "2026-10-26T16:00+07:00", "2026-10-26T17:00+07:00"),
          event(
            "zoned",
            "2026-10-26T16:00[Asia/Ho_Chi_Minh]",
            "2026-10-26T17:00[Asia/Ho_Chi_Minh]",
          ),
          event("calendar", "2026-10-26T09:00Z[u-ca=iso8601]", "2026-10-26T10:00Z[u-ca=iso8601]"),
        ],
      }),
    );
    const [offset, zoned, calendar] = timeline.events;
    expect(offset!.start.toString()).toBe("2026-10-26T09:00:00Z");
    expect(zoned!.start.equals(offset!.start)).toBe(true);
    expect(calendar!.start.equals(offset!.start)).toBe(true);
    expect(timeline.rows[0]!.placements.map(({ offset }) => offset)).toEqual([9, 9, 9]);
  });

  it("rejects endpoints without an offset or time zone, unknown zones and contradictions", () => {
    for (const start of [
      "2026-10-26",
      "2026-10-26T09:00",
      "09:00",
      "2026-10-26T09:00[Mars/Olympus_Mons]",
      "2026-10-26T09:00+01:00[Asia/Ho_Chi_Minh]",
      "not a date",
    ])
      expect(issuesOf(day({ events: [event("e", start, "2026-10-26T10:00Z")] }))).toEqual([
        { path: ["events", 0, "start"], message: expect.any(String) },
      ]);
  });

  it("requires every interval to end after it starts", () => {
    expect(
      issuesOf(
        day({
          range: { start: "2026-10-26T00:00Z", end: "2026-10-26T00:00Z" },
          events: [
            event("empty", "2026-10-26T09:00Z", "2026-10-26T09:00Z"),
            event("backwards", "2026-10-26T10:00Z", "2026-10-26T09:00Z"),
          ],
        }),
      ),
    ).toEqual([
      { path: ["range", "end"], message: "The end must be after the start." },
      { path: ["events", 0, "end"], message: "The end must be after the start." },
      { path: ["events", 1, "end"], message: "The end must be after the start." },
    ]);
  });
});

describe("invalid input", () => {
  it.each([
    ["a zero slot", { slotDuration: "PT0S" }, ["slotDuration"]],
    ["a negative slot", { slotDuration: "-PT1H" }, ["slotDuration"]],
    ["a slot that is not an ISO 8601 duration", { slotDuration: "1 hour" }, ["slotDuration"]],
    ["an empty resource ID", { resources: [{ id: "", title: "Nowhere" }] }, ["resources", 0, "id"]],
    [
      "a duplicate resource ID",
      {
        resources: [
          { id: "room-101", title: "Room 101" },
          { id: "room-101", title: "Room 101 again" },
        ],
      },
      ["resources", 1, "id"],
    ],
    [
      "a duplicate event ID",
      {
        events: [
          event("stay", "2026-10-26T09:00Z", "2026-10-26T10:00Z"),
          event("stay", "2026-10-26T11:00Z", "2026-10-26T12:00Z", "room-102"),
        ],
      },
      ["events", 1, "id"],
    ],
    [
      "an event without a resource",
      {
        events: [
          { id: "stay", title: "Stay", start: "2026-10-26T09:00Z", end: "2026-10-26T10:00Z" },
        ],
      },
      ["events", 0, "resourceIds"],
    ],
    [
      "an event with an empty list of resources",
      { events: [event("stay", "2026-10-26T09:00Z", "2026-10-26T10:00Z", [])] },
      ["events", 0, "resourceIds"],
    ],
    [
      "an event assigned to the same resource twice",
      {
        events: [event("stay", "2026-10-26T09:00Z", "2026-10-26T10:00Z", ["room-101", "room-101"])],
      },
      ["events", 0, "resourceIds", 1],
    ],
    [
      "an event assigned to a group",
      {
        resources: [
          { id: "room-101", title: "Room 101", parentId: "floor-1" },
          { id: "floor-1", title: "Floor 1", kind: "group" },
        ],
        events: [event("stay", "2026-10-26T09:00Z", "2026-10-26T10:00Z", ["room-101", "floor-1"])],
      },
      ["events", 0, "resourceIds", 1],
    ],
    [
      "too many slots",
      { range: { start: "2026-01-01T00:00Z", end: "2027-01-01T00:00Z" }, slotDuration: "PT1H" },
      ["slotDuration"],
    ],
  ])("rejects %s", (_, overrides, path) => {
    expect(issuesOf({ ...day(), ...overrides }).map((issue) => issue.path)).toEqual([path]);
  });

  it("rejects input that is not a timeline at all", () => {
    expect(issuesOf(null)).toHaveLength(1);
    expect(issuesOf({ ...day(), events: "none" })).toEqual([
      { path: ["events"], message: expect.any(String) },
    ]);
  });
});
