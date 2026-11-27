import { Effect, Result, Schema } from "effect";
import type { Temporal } from "temporal-polyfill";
import { decodeInput, type TimelineInputError } from "./input-error.js";
import {
  Datetime,
  DisambiguationSchema,
  instantOf,
  PositiveDuration,
  timeZoneIdOf,
  TimeZone,
  type Disambiguation,
} from "./schema.js";

/** The scale of a timeline: the unit one axis slot covers by default. */
export type TimelinePreset = "hour" | "day" | "week" | "month";

/**
 * What each preset shows unless told otherwise: the length of one slot and the visible range,
 * both ISO 8601 durations. The range starts at the start of the slot unit that holds the
 * anchor, in the display time zone: the hour, the day, the Monday-first week or the month.
 */
export const timelinePresets: Readonly<
  Record<TimelinePreset, { readonly slotDuration: string; readonly visible: string }>
> = {
  hour: { slotDuration: "PT1H", visible: "P1D" },
  day: { slotDuration: "P1D", visible: "P1W" },
  week: { slotDuration: "P1W", visible: "P4W" },
  month: { slotDuration: "P1M", visible: "P1Y" },
};

export interface TimelineViewOptions {
  readonly preset: TimelinePreset;
  /** A moment inside the first slot, written like an event's endpoint. */
  readonly anchor: string;
  /** The time zone to show the timeline in, such as `Asia/Ho_Chi_Minh`. Defaults to `UTC`. */
  readonly timeZone?: string;
  /** How a local time in the anchor resolves when its zone skips or repeats it. */
  readonly disambiguation?: Disambiguation;
  /** The visible range as an ISO 8601 duration; defaults to the preset's. */
  readonly visible?: string;
  /** The length of one slot as an ISO 8601 duration; defaults to the preset's. */
  readonly slotDuration?: string;
}

/** The part of a {@link TimelineInput} that a preset decides; spread it into the input. */
export interface TimelineView {
  readonly range: { readonly start: string; readonly end: string };
  readonly slotDuration: string;
  readonly timeZone: string;
  readonly disambiguation?: Disambiguation;
}

const TimelineViewSchema = Schema.Struct({
  preset: Schema.Literals(["hour", "day", "week", "month"]),
  anchor: Datetime,
  timeZone: Schema.optional(TimeZone),
  disambiguation: Schema.optional(DisambiguationSchema),
  visible: Schema.optional(PositiveDuration),
  slotDuration: Schema.optional(PositiveDuration),
});

/** The start of the slot unit of a preset that holds a moment. */
function alignedStart(preset: TimelinePreset, moment: Temporal.ZonedDateTime) {
  switch (preset) {
    case "hour":
      // Subtract the elapsed time since the hour began so that a moment in a repeated hour
      // stays in the same occurrence of it.
      return moment.subtract({
        minutes: moment.minute,
        seconds: moment.second,
        milliseconds: moment.millisecond,
        microseconds: moment.microsecond,
        nanoseconds: moment.nanosecond,
      });
    case "day":
      return moment.startOfDay();
    case "week":
      return moment.subtract({ days: moment.dayOfWeek - 1 }).startOfDay();
    case "month":
      return moment.with({ day: 1 }).startOfDay();
  }
}

/**
 * The range, slot size and time zone of a timeline at a preset, synchronously. Spread the
 * result into the timeline input with the resources and events.
 */
export function timelineViewResult(
  options: TimelineViewOptions,
): Result.Result<TimelineView, TimelineInputError>;
export function timelineViewResult(
  options: unknown,
): Result.Result<TimelineView, TimelineInputError>;
export function timelineViewResult(
  options: unknown,
): Result.Result<TimelineView, TimelineInputError> {
  const decoded = decodeInput(TimelineViewSchema, options);
  if (Result.isFailure(decoded)) return Result.fail(decoded.failure);
  const { preset, anchor, disambiguation } = decoded.success;
  const timeZone = timeZoneIdOf(decoded.success.timeZone ?? "UTC")!;
  const defaults = timelinePresets[preset];
  const start = alignedStart(
    preset,
    instantOf(anchor, disambiguation)!.toZonedDateTimeISO(timeZone),
  );
  return Result.succeed({
    range: {
      start: start.toString(),
      // Added as a calendar duration in the display zone, so a day lasts as long as it does there.
      end: start.add(decoded.success.visible ?? defaults.visible).toString(),
    },
    slotDuration: decoded.success.slotDuration ?? defaults.slotDuration,
    timeZone,
    ...(disambiguation && { disambiguation }),
  });
}

/** {@link timelineViewResult} as an Effect; nothing runs until the Effect does. */
export function timelineView(
  options: TimelineViewOptions,
): Effect.Effect<TimelineView, TimelineInputError>;
export function timelineView(options: unknown): Effect.Effect<TimelineView, TimelineInputError>;
export function timelineView(options: unknown) {
  return Effect.suspend(() => Effect.fromResult(timelineViewResult(options)));
}
