import { Schema } from "effect";
import { Temporal } from "temporal-polyfill";

/**
 * How a local time in a named zone resolves when the zone skips or repeats it: `compatible`
 * (the default) moves a skipped time forward across the gap and takes the earlier of a repeated
 * time, `earlier` and `later` always take the earlier or later instant, and `reject` refuses
 * both. An endpoint with an offset names one instant already, so this never applies to it.
 */
export type Disambiguation = "compatible" | "earlier" | "later" | "reject";

export const DisambiguationSchema = Schema.Literals(["compatible", "earlier", "later", "reject"]);

/** The instant an endpoint names, or undefined when it does not name exactly one. */
export function instantOf(
  datetime: string,
  disambiguation: Disambiguation = "compatible",
): Temporal.Instant | undefined {
  try {
    // A bracketed time zone may come without an offset; with one, the two must agree. Other
    // bracketed annotations, such as a calendar `[u-ca=iso8601]`, contain `=`.
    if (!/\[!?[^=\]]+\]/.test(datetime)) return Temporal.Instant.from(datetime);
    const [designator = ""] = datetime.split("[");
    // A date with a zone is a day, not a moment: the endpoint needs a time.
    if (!/[Tt ]\d/.test(designator)) return undefined;
    const zoned = Temporal.ZonedDateTime.from(datetime, { offset: "reject", disambiguation });
    // `Z` says the time is UTC, which contradicts a zone that is not at UTC then.
    if (/z$/i.test(designator) && zoned.offsetNanoseconds !== 0) return undefined;
    return zoned.toInstant();
  } catch {
    return undefined;
  }
}

/** The canonical identifier of a time zone, or undefined when it names no zone. */
export function timeZoneIdOf(timeZone: string): string | undefined {
  // Temporal also reads a zone out of a datetime string; only a name or a UTC offset is a zone.
  if (/\[|^\d|\d{4}-\d{2}-\d{2}/.test(timeZone)) return undefined;
  try {
    return Temporal.Instant.fromEpochMilliseconds(0).toZonedDateTimeISO(timeZone).timeZoneId;
  } catch {
    return undefined;
  }
}

export const Datetime = Schema.String.check(
  Schema.makeFilter((datetime) =>
    instantOf(datetime)
      ? undefined
      : "Expected an ISO 8601 datetime with an offset or a time zone, such as 2026-10-26T09:00Z.",
  ),
);

export const TimeZone = Schema.String.check(
  Schema.makeFilter((timeZone) =>
    timeZoneIdOf(timeZone)
      ? undefined
      : "Expected a time zone name such as Asia/Ho_Chi_Minh or a UTC offset such as +07:00.",
  ),
);

/** A positive ISO 8601 duration, or undefined when the text is not one. */
export function positiveDurationOf(duration: string): Temporal.Duration | undefined {
  try {
    const parsed = Temporal.Duration.from(duration);
    return parsed.sign > 0 ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export const PositiveDuration = Schema.String.check(
  Schema.makeFilter((duration) =>
    positiveDurationOf(duration)
      ? undefined
      : "Expected a positive ISO 8601 duration, such as PT1H or P1D.",
  ),
);

export const Id = Schema.String.check(Schema.isMinLength(1));

export const uniqueIds = Schema.makeFilter((items: readonly { id: string }[]) => {
  const seen = new Set<string>();
  return items.flatMap((item, index) => {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      return [];
    }
    return [{ path: [index, "id"], issue: `The ID ${item.id} is used more than once.` }];
  });
});

export const uniqueValues = Schema.makeFilter((values: readonly string[]) => {
  const seen = new Set<string>();
  return values.flatMap((value, index) => {
    if (!seen.has(value)) {
      seen.add(value);
      return [];
    }
    return [{ path: [index], issue: `${value} is listed more than once.` }];
  });
});

/**
 * The problems of an interval written as two endpoints: an endpoint that is a local time its
 * zone skips or repeats under `reject`, or an end that is not after the start.
 */
export function intervalIssues(
  path: readonly PropertyKey[],
  interval: { readonly start: string; readonly end: string },
  disambiguation: Disambiguation,
) {
  const start = instantOf(interval.start, disambiguation);
  const end = instantOf(interval.end, disambiguation);
  const issues: { path: PropertyKey[]; issue: string }[] = [];
  if (!start)
    issues.push({
      path: [...path, "start"],
      issue: "This local time is skipped or repeated in its time zone.",
    });
  if (!end)
    issues.push({
      path: [...path, "end"],
      issue: "This local time is skipped or repeated in its time zone.",
    });
  if (start && end && Temporal.Instant.compare(end, start) <= 0)
    issues.push({ path: [...path, "end"], issue: "The end must be after the start." });
  return issues;
}

/** A duration repeated `times` times, field by field, so calendar units stay calendar units. */
export function scaledDuration(duration: Temporal.Duration, times: number) {
  return Temporal.Duration.from({
    years: duration.years * times,
    months: duration.months * times,
    weeks: duration.weeks * times,
    days: duration.days * times,
    hours: duration.hours * times,
    minutes: duration.minutes * times,
    seconds: duration.seconds * times,
    milliseconds: duration.milliseconds * times,
    microseconds: duration.microseconds * times,
    nanoseconds: duration.nanoseconds * times,
  });
}
