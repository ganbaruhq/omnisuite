import { Result } from "effect";
import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vite-plus/test";
import { snapStepResult, snapToGrid } from "./index.js";

const snapped = (instant: string, step: string, timeZone = "UTC") => {
  const parsed = snapStepResult(step);
  if (Result.isFailure(parsed)) throw new Error(parsed.failure.message);
  return snapToGrid(Temporal.Instant.from(instant), parsed.success, timeZone).toString();
};

describe("snapStepResult", () => {
  it.each(["PT15S"])("accepts the single-unit step %s", (step) => {
    expect(Result.isSuccess(snapStepResult(step))).toBe(true);
  });

  it.each([
    ["not a duration", "half an hour"],
    ["zero", "PT0S"],
    ["negative", "-PT30M"],
    ["two units", "PT1H30M"],
    ["an elapsed step longer than a day", "PT25H"],
    ["an empty string", ""],
  ])("rejects %s", (_name, step) => {
    const parsed = snapStepResult(step);
    expect(Result.isFailure(parsed)).toBe(true);
    if (Result.isFailure(parsed)) expect(parsed.failure.issues[0]!.path).toEqual(["snap"]);
  });

  it("rejects input that is not text", () => {
    expect(Result.isFailure(snapStepResult(undefined))).toBe(true);
    expect(Result.isFailure(snapStepResult(30))).toBe(true);
  });
});

describe("snapToGrid", () => {
  describe("elapsed steps count from local midnight", () => {
    it("breaks a tie toward the later boundary", () => {
      expect(snapped("2026-10-26T09:15Z", "PT30M")).toBe("2026-10-26T09:30:00Z");
      expect(snapped("2026-10-26T09:14:59.999Z", "PT30M")).toBe("2026-10-26T09:00:00Z");
      expect(snapped("2026-10-25T23:45Z", "PT30M")).toBe("2026-10-26T00:00:00Z");
    });

    it("aligns to the clock of the time zone, not to UTC", () => {
      // Kathmandu is UTC+05:45, so its hours begin at a quarter past the UTC hour.
      expect(snapped("2026-10-26T09:20Z", "PT1H", "Asia/Kathmandu")).toBe("2026-10-26T09:15:00Z");
      expect(snapped("2026-10-26T09:50Z", "PT1H", "Asia/Kathmandu")).toBe("2026-10-26T10:15:00Z");
      expect(snapped("2026-10-26T09:40Z", "PT30M", "Asia/Ho_Chi_Minh")).toBe(
        "2026-10-26T09:30:00Z",
      );
    });

    it("restarts at midnight when the step does not divide the day", () => {
      // 07:00 steps give 00:00, 07:00, 14:00, 21:00 and then the next midnight.
      expect(snapped("2026-10-26T22:00Z", "PT7H")).toBe("2026-10-26T21:00:00Z");
      expect(snapped("2026-10-26T23:00Z", "PT7H")).toBe("2026-10-27T00:00:00Z");
      expect(snapped("2026-10-26T02:00Z", "PT90M")).toBe("2026-10-26T01:30:00Z");
      expect(snapped("2026-10-26T23:20Z", "PT90M")).toBe("2026-10-27T00:00:00Z");
    });

    it("counts elapsed hours across a daylight saving change", () => {
      // New York skips 02:00-03:00 on 8 March 2026: 01:00 EST is followed by 03:00 EDT.
      expect(snapped("2026-03-08T06:29Z", "PT1H", "America/New_York")).toBe("2026-03-08T06:00:00Z");
      expect(snapped("2026-03-08T06:31Z", "PT1H", "America/New_York")).toBe("2026-03-08T07:00:00Z");
      // It repeats 01:00-02:00 on 1 November: 01:00 EDT (05:00Z), then 01:00 EST (06:00Z).
      expect(snapped("2026-11-01T05:40Z", "PT1H", "America/New_York")).toBe("2026-11-01T06:00:00Z");
      expect(snapped("2026-11-01T05:20Z", "PT1H", "America/New_York")).toBe("2026-11-01T05:00:00Z");
    });
  });

  describe("day steps", () => {
    it("measures nearness in elapsed time on a day that is not 24 hours long", () => {
      // 1 November in New York lasts 25 hours: 04:00Z to 05:00Z the next day, middle at 16:30Z.
      expect(snapped("2026-11-01T16:29Z", "P1D", "America/New_York")).toBe("2026-11-01T04:00:00Z");
      expect(snapped("2026-11-01T16:30Z", "P1D", "America/New_York")).toBe("2026-11-02T05:00:00Z");
    });

    it("counts multi-day steps from a fixed day, not from the loaded window", () => {
      // 1970-01-01 is day zero, so P2D boundaries fall on even days since then: 26 October 2026
      // is day 20,752 and 28 October is day 20,754, but 27 October is odd.
      expect(snapped("2026-10-26T11:00Z", "P2D")).toBe("2026-10-26T00:00:00Z");
      expect(snapped("2026-10-27T00:00Z", "P2D")).toBe("2026-10-28T00:00:00Z");
      expect(snapped("2026-10-27T05:00Z", "P2D")).toBe("2026-10-28T00:00:00Z");
      expect(snapped("2026-10-26T23:59Z", "P2D")).toBe("2026-10-26T00:00:00Z");
    });
  });

  describe("week steps", () => {
    it("aligns to local midnight on Monday", () => {
      expect(snapped("2026-10-28T10:00Z", "P1W")).toBe("2026-10-26T00:00:00Z");
      expect(snapped("2026-10-29T11:59Z", "P1W")).toBe("2026-10-26T00:00:00Z");
      expect(snapped("2026-10-29T12:00Z", "P1W")).toBe("2026-11-02T00:00:00Z");
      expect(snapped("2026-11-01T23:59Z", "P1W")).toBe("2026-11-02T00:00:00Z");
    });

    it("counts multi-week steps from the first Monday of 1970", () => {
      // 5 January 1970 is week zero, so 26 October 2026 (week 2,964) and 9 November are on a
      // 2-week grid but 2 November (week 2,965) is not.
      expect(snapped("2026-10-30T00:00Z", "P2W")).toBe("2026-10-26T00:00:00Z");
      expect(snapped("2026-11-02T00:00Z", "P2W")).toBe("2026-11-09T00:00:00Z");
      expect(snapped("2026-11-09T00:00Z", "P2W")).toBe("2026-11-09T00:00:00Z");
    });
  });

  describe("month and year steps", () => {
    it("aligns to local midnight on the first of the month", () => {
      expect(snapped("2026-10-16T11:59Z", "P1M")).toBe("2026-10-01T00:00:00Z");
      expect(snapped("2026-10-16T12:00Z", "P1M")).toBe("2026-11-01T00:00:00Z");
      expect(snapped("2026-02-15T12:00Z", "P1M")).toBe("2026-03-01T00:00:00Z");
    });

    it("counts multi-month steps from January 1970", () => {
      expect(snapped("2026-11-10T00:00Z", "P3M")).toBe("2026-10-01T00:00:00Z");
      expect(snapped("2026-11-20T00:00Z", "P3M")).toBe("2027-01-01T00:00:00Z");
    });

    it("aligns year steps to the first of January", () => {
      expect(snapped("2026-03-01T00:00Z", "P1Y")).toBe("2026-01-01T00:00:00Z");
      expect(snapped("2026-09-01T00:00Z", "P1Y")).toBe("2027-01-01T00:00:00Z");
    });
  });

  it("leaves an instant on the grid where it is, whatever the time zone", () => {
    expect(snapped("2026-10-26T17:00Z", "P1D", "Asia/Ho_Chi_Minh")).toBe("2026-10-26T17:00:00Z");
    expect(snapped("2026-10-26T09:45Z", "PT30M", "Asia/Kathmandu")).toBe("2026-10-26T09:45:00Z");
  });
});
