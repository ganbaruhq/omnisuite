import { Schema } from "effect";
import type { Temporal } from "temporal-polyfill";
import {
  constraintsOf,
  EditConstraintsSchema,
  type EditConstraint,
  type EditConstraintInput,
} from "./constraint.js";
import { Datetime, Id, instantOf, uniqueValues, type Disambiguation } from "./schema.js";

/**
 * An event over `[start, end)`. Both endpoints are ISO 8601 datetimes with an offset
 * (`2026-10-26T09:00Z`, `2026-10-26T16:00+07:00`) or a named time zone
 * (`2026-10-26T16:00[Asia/Ho_Chi_Minh]`). The zone only reads a local time: the event keeps its
 * instants whatever time zone the timeline shows. A local time that the zone skips or repeats
 * resolves as the timeline's `disambiguation` says.
 *
 * One event is shown under each of its `resourceIds`, all with the same interval. The IDs must be
 * unique and name resources, not groups; an ID that no loaded resource has is kept, but has no
 * row to show in.
 *
 * The remaining fields only matter to editing, and the timeline never rejects an event for
 * breaking them. They are modelled on FullCalendar's event options of the same names.
 */
export interface CalendarEventInput<TData = unknown> {
  readonly id: string;
  readonly resourceIds: readonly string[];
  readonly title: string;
  readonly start: string;
  readonly end: string;
  readonly data?: TData;
  /** Whether this event's time can be moved; overrides the timeline's `startEditable`. */
  readonly startEditable?: boolean;
  /** Whether this event can be moved to other resources; overrides `resourceEditable`. */
  readonly resourceEditable?: boolean;
  /** Whether either of this event's edges can be resized; overrides `durationEditable`. */
  readonly durationEditable?: boolean;
  /** Intervals that this event must lie within when it is edited, per resource if limited. */
  readonly constraint?: EditConstraintInput | readonly EditConstraintInput[];
  /**
   * `false` forbids any other event from sharing time on a common resource with this one when
   * either of them is edited. `true` leaves the decision to the timeline's `overlap` rule.
   */
  readonly overlap?: boolean;
}

/** An event with its endpoints resolved to instants; every calendar view reads this model. */
export interface CalendarEvent<TData = unknown> {
  readonly id: string;
  readonly resourceIds: readonly string[];
  readonly title: string;
  readonly start: Temporal.Instant;
  readonly end: Temporal.Instant;
  readonly data: TData | undefined;
  readonly startEditable: boolean | undefined;
  readonly resourceEditable: boolean | undefined;
  readonly durationEditable: boolean | undefined;
  readonly constraint: readonly EditConstraint[] | undefined;
  readonly overlap: boolean | undefined;
}

export const CalendarEventSchema = Schema.Struct({
  id: Id,
  resourceIds: Schema.Array(Id).check(Schema.isMinLength(1), uniqueValues),
  title: Schema.String,
  start: Datetime,
  end: Datetime,
  data: Schema.optional(Schema.Unknown),
  startEditable: Schema.optional(Schema.Boolean),
  resourceEditable: Schema.optional(Schema.Boolean),
  durationEditable: Schema.optional(Schema.Boolean),
  constraint: Schema.optional(EditConstraintsSchema),
  overlap: Schema.optional(Schema.Boolean),
});

/** The event a decoded input describes. */
export const calendarEventOf = <TData>(
  input: Schema.Schema.Type<typeof CalendarEventSchema>,
  disambiguation: Disambiguation,
): CalendarEvent<TData> => ({
  id: input.id,
  resourceIds: input.resourceIds,
  title: input.title,
  start: instantOf(input.start, disambiguation)!,
  end: instantOf(input.end, disambiguation)!,
  data: input.data as TData | undefined,
  startEditable: input.startEditable,
  resourceEditable: input.resourceEditable,
  durationEditable: input.durationEditable,
  constraint: constraintsOf(input.constraint, disambiguation),
  overlap: input.overlap,
});
