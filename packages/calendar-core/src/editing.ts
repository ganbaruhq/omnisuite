import { Result, Schema } from "effect";
import { Temporal } from "temporal-polyfill";
import {
  constraintInputOf,
  constraintListOf,
  constraintsOf,
  EditConstraintsSchema,
  type EditConstraint,
  type EditConstraintInput,
} from "./constraint.js";
import type { CalendarEvent, CalendarEventInput } from "./event.js";
import {
  decodeInput,
  inputError,
  type TimelineInputError,
  type TimelineInputIssue,
} from "./input-error.js";
import { instantOf, intervalIssues, scaledDuration, type Disambiguation } from "./schema.js";
import {
  gridBoundaryAfter,
  gridBoundaryBefore,
  snapStepResult,
  snapToGrid,
  type SnapStep,
} from "./snap.js";
import {
  byStartThenId,
  geometryOf,
  occurrenceIdOf,
  placeInLanes,
  type EventPlacement,
  type Timeline,
} from "./timeline.js";

/** Everything a rule may look at besides the proposal itself. */
export interface EditContext<TEventData = unknown> {
  /** The events the timeline holds. Events that are not loaded cannot be seen, so a rule that finds a place free has not proved it free. */
  readonly events: readonly CalendarEvent<TEventData>[];
}

/**
 * A change of an event that the application may accept. `before` and `after` are events in the
 * form of timeline input, with canonical UTC endpoints, so `after` can replace the event as it
 * is. Nothing is persisted by the calendar: the application decides what becomes of a proposal.
 */
export interface EventProposal<TEventData = unknown> {
  readonly operation: "move" | "resize";
  /** The edge that was dragged, for a resize. */
  readonly edge?: ResizeEdge;
  readonly eventId: string;
  /** The rendering that was dragged: the event under the resource it was dragged from. */
  readonly occurrenceId: string;
  readonly sourceResourceId: string;
  /** The resource the rendering was dropped on; for a resize, the one it was dragged on. */
  readonly targetResourceId: string;
  readonly before: CalendarEventInput<TEventData>;
  readonly after: CalendarEventInput<TEventData>;
}

/** The edge of an event that a resize drags. */
export type ResizeEdge = "start" | "end";

/**
 * How events may be edited. The calendar ships no rules and knows nothing of the domain: it only
 * evaluates the ones passed here, modelled on FullCalendar's `eventConstraint`, `eventOverlap`
 * and `eventAllow`. Rules are synchronous and pure, run in the order constraint, overlap, allow,
 * and see only the loaded events.
 */
export interface EditingInput<TEventData = unknown> {
  /**
   * The snap step as an ISO 8601 duration in one unit, such as `PT30M`, `P1D` or `P1W`. It is
   * required and has no default; see {@link snapToGrid} for the grid it makes.
   */
  readonly snap: string;
  /** Whether event times can be moved. Events override it with their own `startEditable`. */
  readonly startEditable?: boolean;
  /** Whether events can move to other resources. Events override it with `resourceEditable`. */
  readonly resourceEditable?: boolean;
  /** Whether either edge of an event can be resized. Events override it with `durationEditable`. */
  readonly durationEditable?: boolean;
  /** Intervals an edited event must lie within, each limited to some resources if it says so. */
  readonly constraint?: EditConstraintInput | readonly EditConstraintInput[];
  /**
   * Decides whether a stationary event and the event being edited may share time on a common
   * resource, for the pairs that an event's own `overlap: false` has not already forbidden.
   * Without it, such pairs are allowed.
   */
  readonly overlap?: (
    stationary: CalendarEvent<TEventData>,
    moving: CalendarEvent<TEventData>,
  ) => boolean;
  /** A final check that receives the proposal that would be emitted. */
  readonly allow?: (
    proposal: EventProposal<TEventData>,
    context: EditContext<TEventData>,
  ) => boolean;
}

/** Editing options that passed validation. */
export interface Editing<TEventData = unknown> {
  readonly snap: SnapStep;
  readonly startEditable: boolean;
  readonly resourceEditable: boolean;
  readonly durationEditable: boolean;
  readonly constraint: readonly EditConstraint[] | undefined;
  readonly overlap: EditingInput<TEventData>["overlap"];
  readonly allow: EditingInput<TEventData>["allow"];
}

const EditingDataSchema = Schema.Struct({
  startEditable: Schema.optional(Schema.Boolean),
  resourceEditable: Schema.optional(Schema.Boolean),
  durationEditable: Schema.optional(Schema.Boolean),
  constraint: Schema.optional(EditConstraintsSchema),
});

const prefixed = (issues: readonly TimelineInputIssue[]) =>
  issues.map(({ path, message }) => ({ path: ["editing", ...path], message }));

/**
 * Validates editing options before editing is enabled: the snap step must be a positive
 * duration in one unit, the capabilities booleans, the constraint valid intervals and the rules
 * functions. Issues are located under `editing`.
 */
export function decodeEditingResult<TEventData>(
  input: EditingInput<TEventData>,
  options?: { readonly disambiguation?: Disambiguation },
): Result.Result<Editing<TEventData>, TimelineInputError>;
export function decodeEditingResult(
  input: unknown,
  options?: { readonly disambiguation?: Disambiguation },
): Result.Result<Editing, TimelineInputError>;
export function decodeEditingResult(
  input: unknown,
  { disambiguation = "compatible" }: { readonly disambiguation?: Disambiguation } = {},
): Result.Result<Editing, TimelineInputError> {
  const record =
    typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const issues: TimelineInputIssue[] = [];
  const snap = snapStepResult(record.snap);
  if (Result.isFailure(snap)) issues.push(...prefixed(snap.failure.issues));
  const data = decodeInput(EditingDataSchema, record);
  if (Result.isFailure(data)) issues.push(...prefixed(data.failure.issues));
  // The intervals are checked even when another field is invalid, so one pass reports them all.
  const constraint = (
    record.constraint === undefined ? [] : constraintListOf(record.constraint)
  ) as readonly Partial<EditConstraintInput>[];
  constraint.forEach((interval, position) => {
    if (
      typeof interval?.start === "string" &&
      typeof interval.end === "string" &&
      instantOf(interval.start) &&
      instantOf(interval.end)
    )
      issues.push(
        ...prefixed(
          intervalIssues(
            Array.isArray(record.constraint) ? ["constraint", position] : ["constraint"],
            { start: interval.start, end: interval.end },
            disambiguation,
          ).map(({ path, issue }) => ({ path, message: issue })),
        ),
      );
  });
  for (const rule of ["overlap", "allow"] as const)
    if (record[rule] !== undefined && typeof record[rule] !== "function")
      issues.push({ path: ["editing", rule], message: "Expected a function." });
  if (issues.length > 0 || Result.isFailure(snap) || Result.isFailure(data))
    return Result.fail(inputError(issues));
  return Result.succeed({
    snap: snap.success,
    startEditable: data.success.startEditable ?? false,
    resourceEditable: data.success.resourceEditable ?? false,
    durationEditable: data.success.durationEditable ?? false,
    constraint: constraintsOf(data.success.constraint, disambiguation),
    overlap: record.overlap as Editing["overlap"],
    allow: record.allow as Editing["allow"],
  });
}

/**
 * How far a gesture moved the event, or the edge it resizes, in time. `slots` is a possibly
 * fractional number of the timeline's slots, which a pointer drag measures: whole slots are added
 * in the slot's own unit, by calendar arithmetic in the display zone for days and longer and by
 * elapsed time for hours and shorter, and the fraction is a share of the slot that follows.
 * `steps` is a whole number of the snap step, which a keyboard edit counts, added the same way.
 */
export type MoveShift = { readonly slots: number } | { readonly steps: number };

export interface MoveRequest {
  readonly eventId: string;
  /** The resource whose rendering is being dragged. */
  readonly sourceResourceId: string;
  /** The resource the rendering is over now; the source when it has not left its row. */
  readonly targetResourceId: string;
  /** Omitted when the gesture has not moved in time. */
  readonly shift?: MoveShift;
}

export type EditRule = "constraint" | "overlap" | "allow";

/** What a move or a resize would do; both are judged by the same rules. */
export type EditEvaluation<TEventData = unknown> =
  /** The event cannot be edited this way at all, so there is nothing to preview. */
  | {
      readonly status: "unavailable";
      readonly reason: "read-only" | "unknown-event" | "unknown-source" | "invalid-target";
    }
  /**
   * The gesture changes nothing. The event keeps its values; it is not rounded to the grid. The
   * proposal has equal `before` and `after`, shows where the event stays, and is never emitted.
   */
  | { readonly status: "unchanged"; readonly proposal: EventProposal<TEventData> }
  | { readonly status: "allowed"; readonly proposal: EventProposal<TEventData> }
  /** The destination breaks `rule`, or the rule threw `error`. Releasing it emits nothing. */
  | {
      readonly status: "rejected";
      readonly proposal: EventProposal<TEventData>;
      readonly rule: EditRule;
      readonly error?: unknown;
    };

function valueOf<TEventData>(event: CalendarEvent<TEventData>): CalendarEventInput<TEventData> {
  return {
    id: event.id,
    resourceIds: event.resourceIds,
    title: event.title,
    start: event.start.toString(),
    end: event.end.toString(),
    ...(event.data !== undefined && { data: event.data }),
    ...(event.startEditable !== undefined && { startEditable: event.startEditable }),
    ...(event.resourceEditable !== undefined && { resourceEditable: event.resourceEditable }),
    ...(event.durationEditable !== undefined && { durationEditable: event.durationEditable }),
    ...(event.constraint !== undefined && { constraint: constraintInputOf(event.constraint)! }),
    ...(event.overlap !== undefined && { overlap: event.overlap }),
  };
}

/** The instant a shift takes a start or an end to, before it is snapped. */
function shiftedInstant(
  timeline: Pick<Timeline, "timeZone" | "slotDuration">,
  snap: SnapStep,
  instant: Temporal.Instant,
  shift: MoveShift,
) {
  const zoned = instant.toZonedDateTimeISO(timeline.timeZone);
  if ("steps" in shift)
    return zoned.add(Temporal.Duration.from({ [snap.unit]: snap.count * shift.steps })).toInstant();
  const whole = Math.floor(shift.slots);
  const base = zoned.add(scaledDuration(timeline.slotDuration, whole));
  const share = shift.slots - whole;
  if (share === 0) return base.toInstant();
  const length = base.add(timeline.slotDuration).epochMilliseconds - base.epochMilliseconds;
  return base.add({ milliseconds: Math.round(share * length) }).toInstant();
}

const sameInstants = (a: readonly Temporal.Instant[], b: readonly Temporal.Instant[]) =>
  a.length === b.length && a.every((instant, index) => instant.equals(b[index]!));

/** Whether the event lies within the constraint on every resource it is assigned to. */
function satisfies(constraint: readonly EditConstraint[] | undefined, event: CalendarEvent<any>) {
  return (
    constraint === undefined ||
    event.resourceIds.every((resourceId) =>
      constraint.some(
        (interval) =>
          (interval.resourceIds === undefined || interval.resourceIds.includes(resourceId)) &&
          Temporal.Instant.compare(interval.start, event.start) <= 0 &&
          Temporal.Instant.compare(event.end, interval.end) <= 0,
      ),
    )
  );
}

/** Whether `other` shares time, as `[start, end)`, with the event on a resource they both have. */
const overlaps = (other: CalendarEvent<any>, event: CalendarEvent<any>) =>
  other.id !== event.id &&
  Temporal.Instant.compare(other.start, event.end) < 0 &&
  Temporal.Instant.compare(event.start, other.end) < 0 &&
  other.resourceIds.some((resourceId) => event.resourceIds.includes(resourceId));

/** The first rule the proposal breaks, if any. A rule that throws counts as breaking. */
function brokenRule<TEventData>(
  timeline: Timeline<any, TEventData>,
  editing: Editing<TEventData>,
  original: CalendarEvent<TEventData>,
  moved: CalendarEvent<TEventData>,
  proposal: EventProposal<TEventData>,
): { readonly rule: EditRule; readonly error?: unknown } | undefined {
  if (!satisfies(editing.constraint, moved) || !satisfies(original.constraint, moved))
    return { rule: "constraint" };
  try {
    for (const other of timeline.events)
      if (overlaps(other, moved)) {
        if (other.overlap === false || moved.overlap === false) return { rule: "overlap" };
        if (editing.overlap && !editing.overlap(other, moved)) return { rule: "overlap" };
      }
  } catch (error) {
    return { rule: "overlap", error };
  }
  try {
    if (editing.allow && !editing.allow(proposal, { events: timeline.events }))
      return { rule: "allow" };
  } catch (error) {
    return { rule: "allow", error };
  }
  return undefined;
}

/**
 * Works out what moving one rendering of an event proposes. This is the one place that decides,
 * so a preview and the proposal emitted on release are the same value.
 *
 * - The start is `shift` applied to the event's start, then snapped to the grid, and the end
 *   keeps the elapsed duration, so it may be off-grid. A gesture whose shifted start snaps to the
 *   same boundary as the event's own start does not move it in time: its values are kept as they
 *   are, even when they are off-grid.
 * - Moving to another resource replaces the source with the target in the event's resources,
 *   and the target joins only if the event is not already on it: dragging A from A+B to C gives
 *   B+C, and onto B gives B.
 * - Each capability is the event's own setting or else the timeline's. A disabled one is ignored
 *   rather than refused: without time movement the shift is dropped, and without resource
 *   movement the event stays on its source.
 * - A proposal is checked against the editing rules in the order constraint, overlap, allow.
 */
export function evaluateMove<TResourceData, TEventData>(
  timeline: Timeline<TResourceData, TEventData>,
  editing: Editing<TEventData> | undefined,
  request: MoveRequest,
): EditEvaluation<TEventData> {
  if (!editing) return { status: "unavailable", reason: "read-only" };
  const event = timeline.events.find(({ id }) => id === request.eventId);
  if (!event) return { status: "unavailable", reason: "unknown-event" };
  if (!event.resourceIds.includes(request.sourceResourceId))
    return { status: "unavailable", reason: "unknown-source" };
  if (
    !timeline.rows.some(
      (row) => row.kind === "resource" && row.resource.id === request.targetResourceId,
    )
  )
    return { status: "unavailable", reason: "invalid-target" };
  const timeEditable = event.startEditable ?? editing.startEditable;
  const resourceEditable = event.resourceEditable ?? editing.resourceEditable;
  if (!timeEditable && !resourceEditable) return { status: "unavailable", reason: "read-only" };

  const targetResourceId = resourceEditable ? request.targetResourceId : request.sourceResourceId;
  let { start, end } = event;
  if (timeEditable && request.shift) {
    const snapped = snapToGrid(
      shiftedInstant(timeline, editing.snap, event.start, request.shift),
      editing.snap,
      timeline.timeZone,
    );
    if (!snapped.equals(snapToGrid(event.start, editing.snap, timeline.timeZone))) {
      start = snapped;
      end = Temporal.Instant.fromEpochNanoseconds(
        snapped.epochNanoseconds + (event.end.epochNanoseconds - event.start.epochNanoseconds),
      );
    }
  }
  const resourceIds =
    targetResourceId === request.sourceResourceId
      ? event.resourceIds
      : [
          ...event.resourceIds.filter((resourceId) => resourceId !== request.sourceResourceId),
          ...(event.resourceIds.includes(targetResourceId) ? [] : [targetResourceId]),
        ];
  const moved: CalendarEvent<TEventData> = { ...event, resourceIds, start, end };
  const proposal: EventProposal<TEventData> = {
    operation: "move",
    eventId: event.id,
    occurrenceId: occurrenceIdOf(event.id, request.sourceResourceId),
    sourceResourceId: request.sourceResourceId,
    targetResourceId,
    before: valueOf(event),
    after: valueOf(moved),
  };
  return judge(timeline, editing, event, moved, proposal);
}

/**
 * Decides what a proposal comes to: nothing when it changes neither the interval nor the
 * resources, otherwise allowed or rejected by the editing rules. A move and a resize share this,
 * so a rule cannot treat one differently from the other.
 */
function judge<TEventData>(
  timeline: Timeline<any, TEventData>,
  editing: Editing<TEventData>,
  event: CalendarEvent<TEventData>,
  edited: CalendarEvent<TEventData>,
  proposal: EventProposal<TEventData>,
): EditEvaluation<TEventData> {
  if (
    sameInstants([edited.start, edited.end], [event.start, event.end]) &&
    edited.resourceIds.length === event.resourceIds.length &&
    edited.resourceIds.every((resourceId, index) => resourceId === event.resourceIds[index])
  )
    return { status: "unchanged", proposal };
  const broken = brokenRule(timeline, editing, event, edited, proposal);
  return broken
    ? {
        status: "rejected",
        proposal,
        rule: broken.rule,
        ...("error" in broken && { error: broken.error }),
      }
    : { status: "allowed", proposal };
}

export interface ResizeRequest {
  readonly eventId: string;
  /** The resource whose rendering's edge is being dragged. */
  readonly resourceId: string;
  readonly edge: ResizeEdge;
  /** Omitted when the gesture has not moved the edge. */
  readonly shift?: MoveShift;
}

/**
 * Works out what dragging one edge of an event proposes, as {@link evaluateMove} does for moving
 * it, so a preview and the proposal emitted on release are the same value.
 *
 * - The dragged edge is `shift` applied to it, then snapped to the same grid as movement. The
 *   opposite edge and the resources stay as they are, even when they are off-grid. A gesture
 *   whose shifted edge snaps to the same boundary as the edge itself changes nothing and does
 *   not round it.
 * - The interval stays positive. An edge that would reach or cross the opposite one is kept at
 *   the nearest grid boundary on the allowed side: the first one after the start for the end, the
 *   last one before the end for the start. No minimum duration is added, so that boundary may
 *   leave less than one snap step.
 * - The capability is the event's own `durationEditable` or else the timeline's.
 * - A proposal is checked against the editing rules in the order constraint, overlap, allow,
 *   against the resulting interval on every resource the event is on.
 */
export function evaluateResize<TResourceData, TEventData>(
  timeline: Timeline<TResourceData, TEventData>,
  editing: Editing<TEventData> | undefined,
  request: ResizeRequest,
): EditEvaluation<TEventData> {
  if (!editing) return { status: "unavailable", reason: "read-only" };
  const event = timeline.events.find(({ id }) => id === request.eventId);
  if (!event) return { status: "unavailable", reason: "unknown-event" };
  if (!event.resourceIds.includes(request.resourceId))
    return { status: "unavailable", reason: "unknown-source" };
  if (!(event.durationEditable ?? editing.durationEditable))
    return { status: "unavailable", reason: "read-only" };

  const { snap } = editing;
  const dragged = request.edge === "start" ? event.start : event.end;
  let edge = dragged;
  if (request.shift) {
    const snapped = snapToGrid(
      shiftedInstant(timeline, snap, dragged, request.shift),
      snap,
      timeline.timeZone,
    );
    if (!snapped.equals(snapToGrid(dragged, snap, timeline.timeZone))) {
      let valid = snapped;
      if (request.edge === "start" && Temporal.Instant.compare(snapped, event.end) >= 0)
        valid = gridBoundaryBefore(event.end, snap, timeline.timeZone);
      else if (request.edge === "end" && Temporal.Instant.compare(snapped, event.start) <= 0)
        valid = gridBoundaryAfter(event.start, snap, timeline.timeZone);
      // A boundary that lies the other way from the drag would lengthen a shortening gesture,
      // so the edge stays where it is.
      if (
        Temporal.Instant.compare(snapped, dragged) * Temporal.Instant.compare(valid, dragged) >=
        0
      )
        edge = valid;
    }
  }
  const resized: CalendarEvent<TEventData> =
    request.edge === "start" ? { ...event, start: edge } : { ...event, end: edge };
  const proposal: EventProposal<TEventData> = {
    operation: "resize",
    edge: request.edge,
    eventId: event.id,
    occurrenceId: occurrenceIdOf(event.id, request.resourceId),
    sourceResourceId: request.resourceId,
    targetResourceId: request.resourceId,
    before: valueOf(event),
    after: valueOf(resized),
  };
  return judge(timeline, editing, event, resized, proposal);
}

/** The target row as it looks while a proposal is previewed. */
export interface PreviewLayout<TEventData = unknown> {
  readonly resourceId: string;
  /** The row's other events, laid out again with the preview among them. */
  readonly placements: readonly EventPlacement<TEventData>[];
  /** The proposal in its lane, or undefined when it lies outside the visible range. */
  readonly preview: EventPlacement<TEventData> | undefined;
  /** The lanes the row needs with the preview in it, at least 1. */
  readonly laneCount: number;
}

/**
 * Lays out the proposal's target row with the proposed event in it: the event's own rendering in
 * that row is left out, since the proposal replaces it, and the others take lanes around the
 * preview exactly as they would around the event once it is accepted.
 */
export function previewLayout<TResourceData, TEventData>(
  timeline: Timeline<TResourceData, TEventData>,
  proposal: EventProposal<TEventData>,
): PreviewLayout<TEventData> {
  const resourceId = proposal.targetResourceId;
  const row = timeline.rows.find((candidate) => candidate.resource.id === resourceId);
  const original = timeline.events.find(({ id }) => id === proposal.eventId);
  if (row?.kind !== "resource" || !original)
    return { resourceId, placements: [], preview: undefined, laneCount: 1 };
  const moved: CalendarEvent<TEventData> = {
    ...original,
    resourceIds: proposal.after.resourceIds,
    start: instantOf(proposal.after.start)!,
    end: instantOf(proposal.after.end)!,
  };
  const geometry = geometryOf(timeline, moved);
  const shown = [
    ...row.placements
      .filter(({ event }) => event.id !== moved.id)
      .map(({ event, offset, span, startsBefore, endsAfter }) => ({
        event,
        geometry: { offset, span, startsBefore, endsAfter },
      })),
    ...(geometry ? [{ event: moved, geometry }] : []),
  ].sort(byStartThenId);
  const { placements, laneCount } = placeInLanes(resourceId, shown);
  return {
    resourceId,
    placements: placements.filter(({ event }) => event.id !== moved.id),
    preview: placements.find(({ event }) => event.id === moved.id),
    laneCount,
  };
}
