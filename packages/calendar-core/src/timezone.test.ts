import { Result } from "effect";
import { describe, expect, it } from "vite-plus/test";
import { decodeTimelineResult, type TimelineInput } from "./index.js";

const input = (overrides: Partial<TimelineInput> = {}): TimelineInput => ({
  range: { start: "2026-10-26T00:00Z", end: "2026-10-27T00:00Z" },
  slotDuration: "PT1H",
  resources: [{ id: "room-101", title: "Room 101" }],
  events: [],
  ...overrides,
});
const stay = (id: string, start: string, end: string) => ({
  id,
  resourceIds: ["room-101"],
  title: id,
  start,
  end,
});

const timelineOf = (value: unknown) => {
  const result = decodeTimelineResult(value);
  if (Result.isFailure(result)) throw new Error(result.failure.message);
  return result.success;
};
const issuesOf = (value: unknown) => {
  const result = decodeTimelineResult(value);
  if (Result.isSuccess(result)) throw new Error("Expected the input to be rejected");
  return result.failure.issues;
};
const hours = (ms: number) => ms / 3_600_000;

describe("display time zone", () => {
  it("shows the timeline in UTC unless told otherwise", () => {
    expect(timelineOf(input()).timeZone).toBe("UTC");
  });

  it("generates slots and labels in the display zone without changing event instants", () => {
    const events = [stay("stay", "2026-10-26T09:00Z", "2026-10-26T11:00Z")];
    const utc = timelineOf(input({ events }));
    const hochiminh = timelineOf(input({ events, timeZone: "Asia/Ho_Chi_Minh" }));

    expect(hochiminh.timeZone).toBe("Asia/Ho_Chi_Minh");
    expect(hochiminh.slots[0]!.start.toString()).toBe(
      "2026-10-26T07:00:00+07:00[Asia/Ho_Chi_Minh]",
    );
    expect(hochiminh.slots[0]!.start.toInstant().toString()).toBe("2026-10-26T00:00:00Z");
    // The same instants fall at the same place in the range, whatever the zone.
    expect(hochiminh.rows[0]!.placements).toEqual(utc.rows[0]!.placements);
    expect(hochiminh.events[0]!.start.toString()).toBe("2026-10-26T09:00:00Z");
    expect(hochiminh.events[0]!.end.toString()).toBe("2026-10-26T11:00:00Z");
  });

  it.each([
    ["an unknown zone", "Mars/Olympus_Mons"],
    ["an empty zone", ""],
    ["a zone that is not text", 7],
    ["a datetime in place of a zone", "2026-10-26T09:00Z[Asia/Tokyo]"],
  ])("rejects %s", (_, timeZone) => {
    expect(issuesOf({ ...input(), timeZone }).map((issue) => issue.path)).toEqual([["timeZone"]]);
  });
});

describe("daylight saving time", () => {
  const newYork = (overrides: Partial<TimelineInput>) =>
    input({ timeZone: "America/New_York", ...overrides });

  it("makes a calendar-day slot as long as the actual day", () => {
    const { slots } = timelineOf(
      newYork({
        range: {
          start: "2026-03-07T00:00[America/New_York]",
          end: "2026-03-10T00:00[America/New_York]",
        },
        slotDuration: "P1D",
      }),
    );
    expect(
      slots.map((slot) => hours(slot.end.epochMilliseconds - slot.start.epochMilliseconds)),
    ).toEqual([24, 23, 24]);

    const fallBack = timelineOf(
      newYork({
        range: {
          start: "2026-10-31T00:00[America/New_York]",
          end: "2026-11-03T00:00[America/New_York]",
        },
        slotDuration: "P1D",
      }),
    );
    expect(
      fallBack.slots.map((slot) =>
        hours(slot.end.epochMilliseconds - slot.start.epochMilliseconds),
      ),
    ).toEqual([24, 25, 24]);
  });

  it("leaves out the skipped hour", () => {
    const { slots } = timelineOf(
      newYork({
        range: {
          start: "2026-03-08T00:00[America/New_York]",
          end: "2026-03-08T05:00[America/New_York]",
        },
      }),
    );
    expect(slots.map((slot) => slot.start.toPlainTime().toString())).toEqual([
      "00:00:00",
      "01:00:00",
      "03:00:00",
      "04:00:00",
    ]);
    expect(slots.every((slot) => !slot.repeated)).toBe(true);
  });

  it("keeps both occurrences of the repeated hour and tells them apart", () => {
    const { slots } = timelineOf(
      newYork({
        range: {
          start: "2026-11-01T00:00[America/New_York]",
          end: "2026-11-01T04:00[America/New_York]",
        },
      }),
    );
    expect(
      slots.map((slot) => [slot.start.toPlainTime().toString(), slot.start.offset, slot.repeated]),
    ).toEqual([
      ["00:00:00", "-04:00", false],
      ["01:00:00", "-04:00", true],
      ["01:00:00", "-05:00", true],
      ["02:00:00", "-05:00", false],
      ["03:00:00", "-05:00", false],
    ]);
    expect(new Set(slots.map((slot) => slot.start.toInstant().toString())).size).toBe(5);
  });

  it("projects events against the actual slots", () => {
    // 01:30 EDT is 05:30Z and 01:30 EST is 06:30Z; the two shifts below are an hour apart.
    const timeline = timelineOf(
      newYork({
        range: {
          start: "2026-11-01T00:00[America/New_York]",
          end: "2026-11-01T04:00[America/New_York]",
        },
        events: [
          stay("first", "2026-11-01T05:30Z", "2026-11-01T06:00Z"),
          stay("second", "2026-11-01T06:30Z", "2026-11-01T07:30Z"),
        ],
      }),
    );
    expect(
      timeline.rows[0]!.placements.map(({ event, offset, span }) => [event.id, offset, span]),
    ).toEqual([
      ["first", 1.5, 0.5],
      ["second", 2.5, 1],
    ]);
  });

  it("measures calendar days and elapsed hours differently across a transition", () => {
    const calendarDays = timelineOf(
      newYork({
        range: {
          start: "2026-11-01T00:00[America/New_York]",
          end: "2026-11-03T00:00[America/New_York]",
        },
        slotDuration: "P1D",
      }),
    );
    const elapsedDays = timelineOf(
      newYork({
        range: {
          start: "2026-11-01T00:00[America/New_York]",
          end: "2026-11-03T00:00[America/New_York]",
        },
        slotDuration: "PT24H",
      }),
    );
    // A day is 25 hours on 1 November, but 24 elapsed hours end an hour before the next midnight.
    expect(calendarDays.slots.map((slot) => slot.end.toString())).toEqual([
      "2026-11-02T00:00:00-05:00[America/New_York]",
      "2026-11-03T00:00:00-05:00[America/New_York]",
    ]);
    expect(elapsedDays.slots.map((slot) => slot.end.toString().slice(0, 25))).toEqual([
      "2026-11-01T23:00:00-05:00",
      "2026-11-02T23:00:00-05:00",
      "2026-11-03T00:00:00-05:00",
    ]);
  });
});

describe("datetime endpoints", () => {
  const withStart = (start: string, overrides: Partial<TimelineInput> = {}) =>
    input({ events: [stay("e", start, "2026-11-02T00:00Z")], ...overrides });

  it("rejects a date with a zone, which is a day rather than a moment", () => {
    expect(issuesOf(withStart("2026-10-26[Asia/Ho_Chi_Minh]")).map((issue) => issue.path)).toEqual([
      ["events", 0, "start"],
    ]);
  });

  it("rejects an offset that contradicts its zone, including Z", () => {
    for (const start of [
      "2026-10-26T09:00+01:00[Asia/Ho_Chi_Minh]",
      "2026-10-26T09:00Z[America/New_York]",
      // New York has no UTC-04:00 in winter.
      "2026-12-01T09:00-04:00[America/New_York]",
    ])
      expect(issuesOf(withStart(start)).map((issue) => issue.path)).toEqual([
        ["events", 0, "start"],
      ]);
  });

  it("accepts an offset that agrees with its zone, including Z in a zone at UTC", () => {
    const timeline = timelineOf(
      input({
        events: [
          stay(
            "a",
            "2026-10-26T09:00+07:00[Asia/Ho_Chi_Minh]",
            "2026-10-26T10:00+07:00[Asia/Ho_Chi_Minh]",
          ),
          stay("b", "2026-12-01T09:00Z[Europe/London]", "2026-12-01T10:00Z[UTC]"),
        ],
      }),
    );
    expect(timeline.events.map((event) => event.start.toString())).toEqual([
      "2026-10-26T02:00:00Z",
      "2026-12-01T09:00:00Z",
    ]);
  });

  it("names the instant of a repeated time by its offset", () => {
    const timeline = timelineOf(
      input({
        events: [
          stay(
            "edt",
            "2026-11-01T01:30-04:00[America/New_York]",
            "2026-11-01T01:45-04:00[America/New_York]",
          ),
          stay(
            "est",
            "2026-11-01T01:30-05:00[America/New_York]",
            "2026-11-01T01:45-05:00[America/New_York]",
          ),
        ],
      }),
    );
    expect(timeline.events.map((event) => event.start.toString())).toEqual([
      "2026-11-01T05:30:00Z",
      "2026-11-01T06:30:00Z",
    ]);
  });

  it("rejects an offset that the zone does not have at that local time", () => {
    // 02:30 on 8 March 2026 does not exist in New York, so no offset fits it.
    expect(
      issuesOf(withStart("2026-03-08T02:30-05:00[America/New_York]")).map((issue) => issue.path),
    ).toEqual([["events", 0, "start"]]);
  });
});

describe("disambiguation", () => {
  const startOf = (
    local: string,
    disambiguation?: "compatible" | "earlier" | "later" | "reject",
  ) => {
    const timeline = timelineOf(
      input({
        events: [stay("e", `${local}[America/New_York]`, "2026-11-03T00:00Z")],
        ...(disambiguation && { disambiguation }),
      }),
    );
    return timeline.events[0]!.start.toString();
  };

  it("shifts a skipped time forward and takes the earlier repeated time by default", () => {
    expect(startOf("2026-03-08T02:30")).toBe("2026-03-08T07:30:00Z"); // 03:30 EDT
    expect(startOf("2026-11-01T01:30")).toBe("2026-11-01T05:30:00Z"); // 01:30 EDT
  });

  it("lets the timeline pick the other occurrence", () => {
    expect(startOf("2026-03-08T02:30", "earlier")).toBe("2026-03-08T06:30:00Z"); // 01:30 EST
    expect(startOf("2026-03-08T02:30", "later")).toBe("2026-03-08T07:30:00Z");
    expect(startOf("2026-11-01T01:30", "later")).toBe("2026-11-01T06:30:00Z"); // 01:30 EST
    expect(startOf("2026-11-01T01:30", "earlier")).toBe("2026-11-01T05:30:00Z");
  });

  it("applies to the range as well as to events", () => {
    const { range } = timelineOf(
      input({
        range: {
          start: "2026-11-01T01:30[America/New_York]",
          end: "2026-11-01T04:00[America/New_York]",
        },
        disambiguation: "later",
      }),
    );
    expect(range.start.toString()).toBe("2026-11-01T06:30:00Z");
  });

  it("can refuse a skipped or repeated time but not an ordinary one", () => {
    const refusing = (start: string) =>
      issuesOf(
        input({
          events: [stay("e", `${start}[America/New_York]`, "2026-11-03T00:00Z")],
          disambiguation: "reject",
        }),
      ).map((issue) => issue.path);
    expect(refusing("2026-03-08T02:30")).toEqual([["events", 0, "start"]]);
    expect(refusing("2026-11-01T01:30")).toEqual([["events", 0, "start"]]);
    expect(startOf("2026-10-26T09:30", "reject")).toBe("2026-10-26T13:30:00Z");
  });

  it("rejects a value that is not a disambiguation", () => {
    expect(issuesOf({ ...input(), disambiguation: "sooner" }).map((issue) => issue.path)).toEqual([
      ["disambiguation"],
    ]);
  });
});
