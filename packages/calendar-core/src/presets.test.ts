import { Effect, Result } from "effect";
import { describe, expect, it } from "vite-plus/test";
import {
  decodeTimelineResult,
  timelinePresets,
  timelineView,
  timelineViewResult,
  TimelineInputError,
  type TimelineViewOptions,
} from "./index.js";

const viewOf = (options: TimelineViewOptions) => {
  const result = timelineViewResult(options);
  if (Result.isFailure(result)) throw new Error(result.failure.message);
  return result.success;
};
const issuesOf = (options: unknown) => {
  const result = timelineViewResult(options);
  if (Result.isSuccess(result)) throw new Error("Expected the options to be rejected");
  return result.failure.issues;
};
/** The timeline a view lays out, with no resources or events. */
const slotsOf = (options: TimelineViewOptions) => {
  const result = decodeTimelineResult({ ...viewOf(options), resources: [], events: [] });
  if (Result.isFailure(result)) throw new Error(result.failure.message);
  return result.success.slots;
};
const startsOf = (options: TimelineViewOptions) =>
  slotsOf(options).map((slot) => slot.start.toString());

describe("timeline presets", () => {
  it("names the default slot and visible range of each scale", () => {
    expect(timelinePresets).toEqual({
      hour: { slotDuration: "PT1H", visible: "P1D" },
      day: { slotDuration: "P1D", visible: "P1W" },
      week: { slotDuration: "P1W", visible: "P4W" },
      month: { slotDuration: "P1M", visible: "P1Y" },
    });
  });

  it("shows a day of hours starting at the hour of the anchor", () => {
    const view = viewOf({ preset: "hour", anchor: "2026-10-26T09:40Z" });
    expect(view).toMatchObject({ slotDuration: "PT1H", timeZone: "UTC" });
    expect(view.range).toEqual({
      start: "2026-10-26T09:00:00+00:00[UTC]",
      end: "2026-10-27T09:00:00+00:00[UTC]",
    });
    expect(slotsOf({ preset: "hour", anchor: "2026-10-26T09:40Z" })).toHaveLength(24);
  });

  it("shows a week of days starting at local midnight", () => {
    const options = {
      preset: "day",
      anchor: "2026-10-28T15:00+07:00",
      timeZone: "Asia/Ho_Chi_Minh",
    } as const;
    expect(viewOf(options).range).toEqual({
      start: "2026-10-28T00:00:00+07:00[Asia/Ho_Chi_Minh]",
      end: "2026-11-04T00:00:00+07:00[Asia/Ho_Chi_Minh]",
    });
    expect(slotsOf(options)).toHaveLength(7);
  });

  it("starts a week on Monday and shows four of them", () => {
    // 28 October 2026 is a Wednesday.
    const slots = startsOf({ preset: "week", anchor: "2026-10-28T12:00Z" });
    expect(slots.map((start) => start.slice(0, 10))).toEqual([
      "2026-10-26",
      "2026-11-02",
      "2026-11-09",
      "2026-11-16",
    ]);
  });

  it("starts a month on its first day and shows twelve of them", () => {
    const slots = startsOf({
      preset: "month",
      anchor: "2026-10-28T12:00Z",
      timeZone: "America/New_York",
    });
    expect(slots).toHaveLength(12);
    expect(slots[0]).toBe("2026-10-01T00:00:00-04:00[America/New_York]");
    expect(slots[1]).toBe("2026-11-01T00:00:00-04:00[America/New_York]");
    expect(slots[2]).toBe("2026-12-01T00:00:00-05:00[America/New_York]");
  });

  it("aligns to the display zone's calendar, not to UTC", () => {
    // 20:00Z on 26 October is already 27 October in Ho Chi Minh City but not in New York.
    const anchor = "2026-10-26T20:00Z";
    expect(viewOf({ preset: "day", anchor, timeZone: "Asia/Ho_Chi_Minh" }).range.start).toBe(
      "2026-10-27T00:00:00+07:00[Asia/Ho_Chi_Minh]",
    );
    expect(viewOf({ preset: "day", anchor, timeZone: "America/New_York" }).range.start).toBe(
      "2026-10-26T00:00:00-04:00[America/New_York]",
    );
  });

  it("configures the visible range and the slot size independently", () => {
    const options = {
      preset: "day",
      anchor: "2026-10-26T00:00Z",
      visible: "P2D",
      slotDuration: "PT6H",
    } as const;
    expect(viewOf(options).slotDuration).toBe("PT6H");
    expect(slotsOf(options)).toHaveLength(8);
    expect(slotsOf({ ...options, visible: "P1D" })).toHaveLength(4);
    expect(slotsOf({ ...options, slotDuration: "PT12H" })).toHaveLength(4);
  });

  it("measures the visible range in calendar days", () => {
    const hours = slotsOf({
      preset: "hour",
      anchor: "2026-11-01T04:00Z",
      timeZone: "America/New_York",
    });
    // Midnight to midnight on the day clocks go back holds 25 hours, one of them repeated.
    expect(hours).toHaveLength(25);
    expect(hours.filter((slot) => slot.repeated)).toHaveLength(2);
    const days = slotsOf({
      preset: "day",
      anchor: "2026-03-07T12:00Z",
      timeZone: "America/New_York",
      slotDuration: "PT1H",
      visible: "P2D",
    });
    expect(days).toHaveLength(47);
  });

  it("keeps the offset of an anchor in a repeated hour", () => {
    const options = {
      preset: "hour",
      anchor: "2026-11-01T06:40Z",
      timeZone: "America/New_York",
    } as const;
    expect(viewOf(options).range.start).toBe("2026-11-01T01:00:00-05:00[America/New_York]");
    expect(viewOf({ ...options, anchor: "2026-11-01T05:40Z" }).range.start).toBe(
      "2026-11-01T01:00:00-04:00[America/New_York]",
    );
  });

  it("resolves a local anchor by the disambiguation", () => {
    const options = {
      preset: "hour",
      anchor: "2026-11-01T01:40[America/New_York]",
      timeZone: "America/New_York",
    } as const;
    expect(viewOf(options).range.start).toBe("2026-11-01T01:00:00-04:00[America/New_York]");
    expect(viewOf({ ...options, disambiguation: "later" }).range.start).toBe(
      "2026-11-01T01:00:00-05:00[America/New_York]",
    );
  });

  it("passes the disambiguation on so a timeline reads its endpoints the same way", () => {
    expect(
      viewOf({ preset: "day", anchor: "2026-10-26T00:00Z", disambiguation: "later" }),
    ).toMatchObject({
      disambiguation: "later",
    });
    expect(viewOf({ preset: "day", anchor: "2026-10-26T00:00Z" })).not.toHaveProperty(
      "disambiguation",
    );
  });

  it("is a lazy Effect that fails with TimelineInputError", async () => {
    const valid = timelineView({ preset: "day", anchor: "2026-10-26T00:00Z" });
    expect((await Effect.runPromise(valid)).slotDuration).toBe("P1D");
    const failure = await Effect.runPromise(
      Effect.flip(timelineView({ preset: "day", anchor: "2026-10-26" })),
    );
    expect(failure).toBeInstanceOf(TimelineInputError);
  });

  it.each([
    ["an unknown preset", { preset: "year", anchor: "2026-10-26T00:00Z" }, ["preset"]],
    ["a missing anchor", { preset: "day" }, ["anchor"]],
    ["a bare date for an anchor", { preset: "day", anchor: "2026-10-26" }, ["anchor"]],
    [
      "an unknown time zone",
      { preset: "day", anchor: "2026-10-26T00:00Z", timeZone: "Mars/Olympus_Mons" },
      ["timeZone"],
    ],
    [
      "a visible range that is not a duration",
      { preset: "day", anchor: "2026-10-26T00:00Z", visible: "a week" },
      ["visible"],
    ],
    [
      "a negative slot",
      { preset: "day", anchor: "2026-10-26T00:00Z", slotDuration: "-PT1H" },
      ["slotDuration"],
    ],
  ])("rejects %s", (_, options, path) => {
    expect(issuesOf(options).map((issue) => issue.path)).toEqual([path]);
  });
});
