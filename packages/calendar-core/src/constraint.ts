import { Schema } from "effect";
import type { Temporal } from "temporal-polyfill";
import { Datetime, Id, instantOf, uniqueValues, type Disambiguation } from "./schema.js";

/**
 * An interval, optionally limited to some resources, that an edited event must lie within. Its
 * endpoints are written like an event's, and it is `[start, end)` like an event.
 */
export interface EditConstraintInput {
  readonly start: string;
  readonly end: string;
  /** The resources the interval applies to; omitted, it applies to every resource. */
  readonly resourceIds?: readonly string[];
}

export interface EditConstraint {
  readonly start: Temporal.Instant;
  readonly end: Temporal.Instant;
  readonly resourceIds: readonly string[] | undefined;
}

const EditConstraintSchema = Schema.Struct({
  start: Datetime,
  end: Datetime,
  resourceIds: Schema.optional(Schema.Array(Id).check(Schema.isMinLength(1), uniqueValues)),
});

/** One interval or a list of them; a list is satisfied by any of its intervals. */
export const EditConstraintsSchema = Schema.Union([
  EditConstraintSchema,
  Schema.Array(EditConstraintSchema),
]);

type DecodedConstraints = Schema.Schema.Type<typeof EditConstraintsSchema>;

/** The intervals of a constraint as a list, however it was written. */
export const constraintListOf = <T>(constraint: T | readonly T[]): readonly T[] =>
  Array.isArray(constraint) ? (constraint as readonly T[]) : [constraint as T];

/** The constraint a decoded input describes, or undefined when none was given. */
export function constraintsOf(
  input: DecodedConstraints | undefined,
  disambiguation: Disambiguation,
): readonly EditConstraint[] | undefined {
  if (input === undefined) return undefined;
  return constraintListOf(input).map((interval) => ({
    start: instantOf(interval.start, disambiguation)!,
    end: instantOf(interval.end, disambiguation)!,
    resourceIds: interval.resourceIds,
  }));
}

/** The constraint in the form of input, with canonical UTC endpoints. */
export const constraintInputOf = (
  constraint: readonly EditConstraint[] | undefined,
): readonly EditConstraintInput[] | undefined =>
  constraint?.map(({ start, end, resourceIds }) => ({
    start: start.toString(),
    end: end.toString(),
    ...(resourceIds && { resourceIds }),
  }));
