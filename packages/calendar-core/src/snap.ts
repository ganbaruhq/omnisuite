import { Result } from "effect";
import { Temporal } from "temporal-polyfill";
import { inputError, type TimelineInputError } from "./input-error.js";
import { positiveDurationOf } from "./schema.js";

type ElapsedUnit = "seconds" | "minutes" | "hours";
type CalendarUnit = "days" | "weeks" | "months" | "years";

/**
 * A snap step: a whole number of one unit. Seconds, minutes and hours are elapsed time counted
 * from local midnight; days, weeks, months and years are calendar units of the display zone.
 */
export interface SnapStep {
  readonly unit: ElapsedUnit | CalendarUnit;
  readonly count: number;
}

const elapsedNanoseconds: Record<ElapsedUnit, bigint> = {
  seconds: 1_000_000_000n,
  minutes: 60_000_000_000n,
  hours: 3_600_000_000_000n,
};
const day = 86_400_000_000_000n;

const units = ["seconds", "minutes", "hours", "days", "weeks", "months", "years"] as const;
const message =
  "Expected a positive ISO 8601 duration in a single unit, such as PT30M, PT1H, P1D or P1W, " +
  "no longer than a day when it counts hours or less.";

/**
 * Reads a snap step such as `PT30M` or `P1D`. The step has exactly one non-zero unit, because a
 * mixed step has no single grid to align to, and a step of hours or less lasts at most a day,
 * because the grid of one restarts at every local midnight; use a day step for longer.
 */
export function snapStepResult(step: unknown): Result.Result<SnapStep, TimelineInputError> {
  const invalid = () => Result.fail(inputError([{ path: ["snap"], message }]));
  const duration = typeof step === "string" ? positiveDurationOf(step) : undefined;
  if (!duration) return invalid();
  const used = units.filter((unit) => duration[unit] !== 0);
  const [unit] = used;
  if (
    used.length !== 1 ||
    unit === undefined ||
    duration.milliseconds !== 0 ||
    duration.microseconds !== 0 ||
    duration.nanoseconds !== 0
  )
    return invalid();
  const count = duration[unit];
  if (unit in elapsedNanoseconds && BigInt(count) * elapsedNanoseconds[unit as ElapsedUnit] > day)
    return invalid();
  return Result.succeed({ unit, count });
}

const epochDay = Temporal.PlainDate.from("1970-01-01");
// The first Monday of 1970: multi-week steps count Monday-first weeks from here.
const epochMonday = Temporal.PlainDate.from("1970-01-05");

const floorDivide = (dividend: number, divisor: number) => Math.floor(dividend / divisor);

/** The local midnight at the start of a date, as nanoseconds since the epoch. */
const startOf = (date: Temporal.PlainDate, timeZone: string) =>
  date.toZonedDateTime(timeZone).epochNanoseconds;

/** The grid boundaries on either side of an instant: `before` is at or before it. */
function surrounding(instant: Temporal.Instant, { unit, count }: SnapStep, timeZone: string) {
  const zoned = instant.toZonedDateTimeISO(timeZone);
  const date = zoned.toPlainDate();
  switch (unit) {
    case "seconds":
    case "minutes":
    case "hours": {
      const midnight = startOf(date, timeZone);
      const step = BigInt(count) * elapsedNanoseconds[unit];
      const before = midnight + ((instant.epochNanoseconds - midnight) / step) * step;
      // The next local midnight is always a boundary: the grid restarts there.
      const nextMidnight = startOf(date.add({ days: 1 }), timeZone);
      return { before, after: before + step < nextMidnight ? before + step : nextMidnight };
    }
    case "days":
    case "weeks": {
      const origin = unit === "days" ? epochDay : epochMonday;
      const length = unit === "days" ? count : count * 7;
      const index = floorDivide(date.since(origin, { largestUnit: "days" }).days, length);
      const first = origin.add({ days: index * length });
      return {
        before: startOf(first, timeZone),
        after: startOf(first.add({ days: length }), timeZone),
      };
    }
    case "months": {
      const months = (date.year - 1970) * 12 + date.month - 1;
      const first = Temporal.PlainDate.from("1970-01-01").add({
        months: floorDivide(months, count) * count,
      });
      return {
        before: startOf(first, timeZone),
        after: startOf(first.add({ months: count }), timeZone),
      };
    }
    case "years": {
      const first = Temporal.PlainDate.from({
        year: 1970 + floorDivide(date.year - 1970, count) * count,
        month: 1,
        day: 1,
      });
      return {
        before: startOf(first, timeZone),
        after: startOf(first.add({ years: count }), timeZone),
      };
    }
  }
}

/**
 * The nearest grid boundary to an instant; an instant exactly between two boundaries goes to the
 * later one. The grid depends only on the step and the time zone, never on what is loaded or
 * shown:
 *
 * - Seconds, minutes and hours count elapsed time from the local midnight that begins the day
 *   holding the instant, and the next midnight is a boundary too. On a day of 23 or 25 hours the
 *   grid follows the clock's elapsed time, and a repeated hour has two sets of boundaries.
 * - Days are counted from 1970-01-01, so a step of several days has the same boundaries however
 *   the timeline is scrolled.
 * - Weeks begin on Monday and are counted from Monday 1970-01-05.
 * - Months and years begin on the 1st of the month and 1 January, counted from January 1970.
 *
 * Boundaries of calendar units are local midnights of the zone, and nearness is measured in
 * elapsed time, so on a 25-hour day the middle is 12.5 hours in.
 */
export function snapToGrid(
  instant: Temporal.Instant,
  step: SnapStep,
  timeZone: string,
): Temporal.Instant {
  const { before, after } = surrounding(instant, step, timeZone);
  const nearest =
    after - instant.epochNanoseconds <= instant.epochNanoseconds - before ? after : before;
  return Temporal.Instant.fromEpochNanoseconds(nearest);
}

/** The last grid boundary strictly before an instant. */
export function gridBoundaryBefore(
  instant: Temporal.Instant,
  step: SnapStep,
  timeZone: string,
): Temporal.Instant {
  const earlier = Temporal.Instant.fromEpochNanoseconds(instant.epochNanoseconds - 1n);
  return Temporal.Instant.fromEpochNanoseconds(surrounding(earlier, step, timeZone).before);
}

/** The first grid boundary strictly after an instant. */
export function gridBoundaryAfter(
  instant: Temporal.Instant,
  step: SnapStep,
  timeZone: string,
): Temporal.Instant {
  return Temporal.Instant.fromEpochNanoseconds(surrounding(instant, step, timeZone).after);
}
