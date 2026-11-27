import { Effect, Result, Schema } from "effect";
import { Temporal } from "temporal-polyfill";
import {
  calendarEventOf,
  CalendarEventSchema,
  type CalendarEvent,
  type CalendarEventInput,
} from "./event.js";
import {
  calendarNodeOf,
  CalendarNodeSchema,
  type CalendarNode,
  type CalendarNodeInput,
  type CalendarResource,
  type CalendarGroup,
} from "./resource.js";
import {
  decodeInput,
  inputError,
  TimelineInputError,
  type TimelineInputIssue,
} from "./input-error.js";
import {
  Datetime,
  DisambiguationSchema,
  instantOf,
  intervalIssues,
  PositiveDuration,
  positiveDurationOf,
  scaledDuration,
  timeZoneIdOf,
  TimeZone,
  uniqueIds,
  type Disambiguation,
} from "./schema.js";

export interface TimelineInput<TResourceData = unknown, TEventData = unknown> {
  /** The visible window, `[start, end)`, with endpoints written like an event's. */
  readonly range: { readonly start: string; readonly end: string };
  /**
   * The length of one axis slot as an ISO 8601 duration, such as `PT1H` or `P1D`. Years, months,
   * weeks and days are calendar units counted in the display time zone, so a day lasts 23 or 25
   * hours across a daylight saving change; hours and smaller are elapsed time.
   */
  readonly slotDuration: string;
  /**
   * The time zone slots and labels are in, such as `Asia/Ho_Chi_Minh`. Events keep their
   * instants whatever it is. Defaults to `UTC`.
   */
  readonly timeZone?: string;
  /** How an endpoint's local time resolves when its zone skips or repeats it. */
  readonly disambiguation?: Disambiguation;
  readonly resources: readonly CalendarNodeInput<TResourceData>[];
  readonly events: readonly CalendarEventInput<TEventData>[];
}

/**
 * One slot of the axis. `offset` and `span` are in slot units: every slot spans 1 except a
 * last slot that the end of the range cuts short.
 *
 * `start` and `end` carry the zone and the offset at that moment. When the zone repeats the hour
 * a slot starts in, as it does when daylight saving time ends, the clock shows that time twice:
 * `repeated` is then true and `start.offset` tells the two slots apart.
 */
export interface TimelineSlot {
  readonly start: Temporal.ZonedDateTime;
  readonly end: Temporal.ZonedDateTime;
  readonly offset: number;
  readonly span: number;
  readonly repeated: boolean;
}

/**
 * One rendering of an event under one of its resources: where it shows in the range, in slot
 * units. `event` is the shared, authoritative event, so every occurrence of it is the same
 * object. It is clipped to the range; `startsBefore` and `endsAfter` tell when the event's true
 * endpoints lie outside it.
 */
export interface EventPlacement<TData = unknown> {
  readonly event: CalendarEvent<TData>;
  /** The resource whose row this occurrence is in. */
  readonly resourceId: string;
  /** Identifies this occurrence among all of them; the event's ID alone is shared. */
  readonly occurrenceId: string;
  /** The lane within the row, from 0. Events that overlap in time are in different lanes. */
  readonly lane: number;
  readonly offset: number;
  readonly span: number;
  readonly startsBefore: boolean;
  readonly endsAfter: boolean;
}

interface HierarchyRow {
  /** Root nodes have depth zero. */
  readonly depth: number;
  /** Whether the node can be expanded: it has loaded children, or its `lazyChildren` are to load. */
  readonly hasChildren: boolean;
}

export interface TimelineResourceRow<
  TResourceData = unknown,
  TEventData = unknown,
> extends HierarchyRow {
  readonly kind: "resource";
  readonly resource: CalendarResource<TResourceData>;
  /** Only this resource's events, in the range, by start and then ID. */
  readonly placements: readonly EventPlacement<TEventData>[];
  /** The lanes the placements take, at least 1 so that an empty row keeps its height. */
  readonly laneCount: number;
}

export interface TimelineGroupRow<TResourceData = unknown> extends HierarchyRow {
  readonly kind: "group";
  readonly resource: CalendarGroup<TResourceData>;
  readonly placements: readonly [];
}

export type TimelineRow<TResourceData = unknown, TEventData = unknown> =
  | TimelineResourceRow<TResourceData, TEventData>
  | TimelineGroupRow<TResourceData>;

export interface Timeline<TResourceData = unknown, TEventData = unknown> {
  readonly range: { readonly start: Temporal.Instant; readonly end: Temporal.Instant };
  /** The time zone slots are generated in. */
  readonly timeZone: string;
  /** The length of one slot, counted in calendar units of the zone where it has any. */
  readonly slotDuration: Temporal.Duration;
  readonly slots: readonly TimelineSlot[];
  /** The width of the whole range in slot units. */
  readonly span: number;
  /** Every node in preorder, including collapsed descendants. Siblings keep input order. */
  readonly rows: readonly TimelineRow<TResourceData, TEventData>[];
  /** Every event, including those for resources that are not loaded. */
  readonly events: readonly CalendarEvent<TEventData>[];
}

/** The most slots one timeline generates; more fail as invalid input. */
export const maxSlotCount = 5000;

function constraintIssues(
  path: readonly PropertyKey[],
  constraint:
    | { start: string; end: string }
    | readonly { start: string; end: string }[]
    | undefined,
  disambiguation: Disambiguation,
) {
  if (constraint === undefined) return [];
  if ("start" in constraint) return intervalIssues(path, constraint, disambiguation);
  return constraint.flatMap((interval, position) =>
    intervalIssues([...path, position], interval, disambiguation),
  );
}

/**
 * Every interval must end after it starts, and under `reject` no endpoint may be a local time
 * its zone skips or repeats. Both depend on the timeline's `disambiguation`, so this checks the
 * whole input rather than one interval. Event constraints are intervals too.
 */
const intervalsAreValid = Schema.makeFilter(
  (input: {
    range: { start: string; end: string };
    events: readonly {
      start: string;
      end: string;
      constraint?: { start: string; end: string } | readonly { start: string; end: string }[];
    }[];
    disambiguation?: Disambiguation | undefined;
  }) => {
    const disambiguation = input.disambiguation ?? "compatible";
    return [
      ...intervalIssues(["range"], input.range, disambiguation),
      ...input.events.flatMap((event, index) => [
        ...intervalIssues(["events", index], event, disambiguation),
        ...constraintIssues(["events", index, "constraint"], event.constraint, disambiguation),
      ]),
    ];
  },
);

const TimelineSchema = Schema.Struct({
  range: Schema.Struct({ start: Datetime, end: Datetime }),
  slotDuration: PositiveDuration,
  timeZone: Schema.optional(TimeZone),
  disambiguation: Schema.optional(DisambiguationSchema),
  resources: Schema.Array(CalendarNodeSchema).check(uniqueIds),
  events: Schema.Array(CalendarEventSchema).check(uniqueIds),
}).check(intervalsAreValid);

/** Whether the zone shows the wall-clock time of this moment twice, as when clocks go back. */
function isRepeated(moment: Temporal.ZonedDateTime) {
  const wallClock = moment.toPlainDateTime();
  const { timeZoneId } = moment;
  return !wallClock
    .toZonedDateTime(timeZoneId, { disambiguation: "earlier" })
    .equals(wallClock.toZonedDateTime(timeZoneId, { disambiguation: "later" }));
}

function slotsOf(
  start: Temporal.Instant,
  end: Temporal.Instant,
  slotDuration: Temporal.Duration,
  timeZone: string,
) {
  const origin = start.toZonedDateTimeISO(timeZone);
  const boundaryAt = (index: number) => origin.add(scaledDuration(slotDuration, index));
  const rangeEnd = end.toZonedDateTimeISO(timeZone);
  const slots: TimelineSlot[] = [];
  // Each boundary is counted from the origin, so a month after Jan 31 is Feb 28 and the next
  // is Mar 31 rather than Mar 28.
  for (let index = 0, slotStart = origin; slotStart.epochNanoseconds < end.epochNanoseconds;) {
    if (slots.length === maxSlotCount) return undefined;
    const nominalEnd = boundaryAt(index + 1);
    const clipped = Temporal.ZonedDateTime.compare(nominalEnd, rangeEnd) > 0;
    slots.push({
      start: slotStart,
      repeated: isRepeated(slotStart),
      end: clipped ? rangeEnd : nominalEnd,
      offset: index,
      span: clipped
        ? (rangeEnd.epochMilliseconds - slotStart.epochMilliseconds) /
          (nominalEnd.epochMilliseconds - slotStart.epochMilliseconds)
        : 1,
    });
    index += 1;
    slotStart = nominalEnd;
  }
  return slots;
}

/** The position of an instant inside the range, in slot units. */
function positionOf(slots: readonly TimelineSlot[], span: number, instant: Temporal.Instant) {
  const time = instant.epochMilliseconds;
  let low = 0;
  let high = slots.length - 1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    const slot = slots[middle]!;
    if (time < slot.start.epochMilliseconds) high = middle - 1;
    else if (time >= slot.end.epochMilliseconds) low = middle + 1;
    else
      return (
        slot.offset +
        (slot.span * (time - slot.start.epochMilliseconds)) /
          (slot.end.epochMilliseconds - slot.start.epochMilliseconds)
      );
  }
  return low === 0 ? 0 : span;
}

export type EventGeometry = Pick<EventPlacement, "offset" | "span" | "startsBefore" | "endsAfter">;

/** Where an event shows on the timeline, or undefined when it lies outside the range. */
export function geometryOf(
  { range, slots, span }: Pick<Timeline, "range" | "slots" | "span">,
  event: CalendarEvent,
): EventGeometry | undefined {
  // Intervals are [start, end): an event touching the range only at a boundary is outside it.
  if (
    Temporal.Instant.compare(event.start, range.end) >= 0 ||
    Temporal.Instant.compare(event.end, range.start) <= 0
  )
    return undefined;
  const startsBefore = Temporal.Instant.compare(event.start, range.start) < 0;
  const endsAfter = Temporal.Instant.compare(event.end, range.end) > 0;
  const offset = startsBefore ? 0 : positionOf(slots, span, event.start);
  const end = endsAfter ? span : positionOf(slots, span, event.end);
  return { offset, span: end - offset, startsBefore, endsAfter };
}

/** Orders events by start, then by ID so that equal starts keep a stable order. */
export function byStartThenId(a: { event: CalendarEvent }, b: { event: CalendarEvent }) {
  const byStart = Temporal.Instant.compare(a.event.start, b.event.start);
  if (byStart !== 0) return byStart;
  if (a.event.id === b.event.id) return 0;
  return a.event.id < b.event.id ? -1 : 1;
}

/** A JSON array, so that IDs containing separators cannot make two occurrences collide. */
export const occurrenceIdOf = (eventId: string, resourceId: string) =>
  JSON.stringify([eventId, resourceId]);

/** An event that lies in the range, with where it shows; every resource it names gets a copy. */
export interface ShownEvent<TData> {
  readonly event: CalendarEvent<TData>;
  readonly geometry: EventGeometry;
}

/**
 * Gives each event the first lane that is free when it starts. An event that starts as another
 * ends does not overlap it, so they share a lane. The same events always get the same lanes.
 */
export function placeInLanes<TData>(resourceId: string, shown: readonly ShownEvent<TData>[]) {
  const laneEnds: Temporal.Instant[] = [];
  const placements = shown.map(({ event, geometry }): EventPlacement<TData> => {
    let lane = laneEnds.findIndex((end) => Temporal.Instant.compare(end, event.start) <= 0);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = event.end;
    return {
      event,
      resourceId,
      occurrenceId: occurrenceIdOf(event.id, resourceId),
      lane,
      ...geometry,
    };
  });
  return { placements, laneCount: Math.max(1, laneEnds.length) };
}

function hierarchyOf<TData>(
  resources: readonly CalendarNode<TData>[],
): Result.Result<
  readonly (HierarchyRow & { readonly resource: CalendarNode<TData> })[],
  TimelineInputError
> {
  const byId = new Map(resources.map((resource) => [resource.id, resource]));
  const children = new Map<string | null, CalendarNode<TData>[]>();
  const issues: TimelineInputIssue[] = [];
  resources.forEach((resource, index) => {
    const parent = resource.parentId === null ? undefined : byId.get(resource.parentId);
    if (resource.parentId !== null && !parent)
      issues.push({
        path: ["resources", index, "parentId"],
        message: `The parent ${resource.parentId} is not loaded.`,
      });
    else if (parent?.kind === "resource" && resource.kind === "group")
      issues.push({
        path: ["resources", index, "parentId"],
        message: "A resource may contain resources, but cannot contain a group.",
      });
    const siblings = children.get(resource.parentId) ?? [];
    siblings.push(resource);
    children.set(resource.parentId, siblings);
  });
  if (issues.length > 0) return Result.fail(inputError(issues));

  const rows: (HierarchyRow & { readonly resource: CalendarNode<TData> })[] = [];
  const visited = new Set<string>();
  const stack = (children.get(null) ?? []).map((resource) => ({ resource, depth: 0 })).reverse();
  while (stack.length > 0) {
    const entry = stack.pop()!;
    visited.add(entry.resource.id);
    const descendants = children.get(entry.resource.id) ?? [];
    rows.push({
      ...entry,
      hasChildren: descendants.length > 0 || entry.resource.lazyChildren,
    });
    for (let index = descendants.length - 1; index >= 0; index -= 1)
      stack.push({ resource: descendants[index]!, depth: entry.depth + 1 });
  }
  if (rows.length !== resources.length) {
    let resource = resources.find((node) => !visited.has(node.id))!;
    const ancestry = new Set<string>();
    while (!ancestry.has(resource.id)) {
      ancestry.add(resource.id);
      resource = byId.get(resource.parentId!)!;
    }
    return Result.fail(
      inputError([
        {
          path: ["resources", resources.indexOf(resource), "parentId"],
          message: `The hierarchy contains a cycle through ${resource.id}.`,
        },
      ]),
    );
  }
  return Result.succeed(rows);
}

/** Filters a complete preorder without changing the expansion state of hidden descendants. */
export function visibleTimelineRows<TResourceData, TEventData>(
  rows: readonly TimelineRow<TResourceData, TEventData>[],
  collapsedIds: ReadonlySet<string>,
): readonly TimelineRow<TResourceData, TEventData>[] {
  const visible: TimelineRow<TResourceData, TEventData>[] = [];
  let hiddenBelow: number | undefined;
  for (const row of rows) {
    if (hiddenBelow !== undefined && row.depth > hiddenBelow) continue;
    visible.push(row);
    hiddenBelow = row.hasChildren && collapsedIds.has(row.resource.id) ? row.depth : undefined;
  }
  return visible;
}

function timelineOf<TResourceData, TEventData>(
  input: Schema.Schema.Type<typeof TimelineSchema>,
): Result.Result<Timeline<TResourceData, TEventData>, TimelineInputError> {
  const nodes = input.resources.map(calendarNodeOf<TResourceData>);
  const hierarchy = hierarchyOf(nodes);
  if (Result.isFailure(hierarchy)) return Result.fail(hierarchy.failure);
  const groupIds = new Set(nodes.filter((node) => node.kind === "group").map((node) => node.id));
  const groupAssignments = input.events.flatMap((event, index) =>
    event.resourceIds.flatMap((resourceId, position) =>
      groupIds.has(resourceId)
        ? [
            {
              path: ["events", index, "resourceIds", position],
              message: `The group ${resourceId} cannot own events.`,
            },
          ]
        : [],
    ),
  );
  if (groupAssignments.length > 0) return Result.fail(inputError(groupAssignments));
  const disambiguation = input.disambiguation ?? "compatible";
  const timeZone = timeZoneIdOf(input.timeZone ?? "UTC")!;
  const range = {
    start: instantOf(input.range.start, disambiguation)!,
    end: instantOf(input.range.end, disambiguation)!,
  };
  const slotDuration = positiveDurationOf(input.slotDuration)!;
  const slots = slotsOf(range.start, range.end, slotDuration, timeZone);
  if (!slots)
    return Result.fail(
      inputError([
        {
          path: ["slotDuration"],
          message: `The range holds more than ${maxSlotCount} slots of this duration.`,
        },
      ]),
    );
  const span = slots.reduce((total, slot) => total + slot.span, 0);
  const events = input.events.map((event) => calendarEventOf<TEventData>(event, disambiguation));
  const layout = { range, slots, span };
  const shownByResource = new Map<string, ShownEvent<TEventData>[]>();
  for (const event of events) {
    const geometry = geometryOf(layout, event);
    if (!geometry) continue;
    // Every resource gets the same geometry: the occurrences differ only in their row.
    for (const resourceId of event.resourceIds) {
      const shown = shownByResource.get(resourceId) ?? [];
      shown.push({ event, geometry });
      shownByResource.set(resourceId, shown);
    }
  }
  const rows = hierarchy.success.map(
    ({ resource, depth, hasChildren }): TimelineRow<TResourceData, TEventData> =>
      resource.kind === "group"
        ? { kind: "group", resource, depth, hasChildren, placements: [] }
        : {
            kind: "resource",
            resource,
            depth,
            hasChildren,
            ...placeInLanes(
              resource.id,
              (shownByResource.get(resource.id) ?? []).sort(byStartThenId),
            ),
          },
  );
  return Result.succeed({ range, timeZone, slotDuration, slots, span, rows, events });
}

/**
 * Validates timeline input and lays it out, synchronously. Events for resources that are not
 * in `resources` are kept in `events` but get no row.
 */
export function decodeTimelineResult<TResourceData, TEventData>(
  input: TimelineInput<TResourceData, TEventData>,
): Result.Result<Timeline<TResourceData, TEventData>, TimelineInputError>;
export function decodeTimelineResult(input: unknown): Result.Result<Timeline, TimelineInputError>;
export function decodeTimelineResult<TResourceData, TEventData>(
  input: unknown,
): Result.Result<Timeline<TResourceData, TEventData>, TimelineInputError> {
  const decoded = decodeInput(TimelineSchema, input);
  return Result.isFailure(decoded)
    ? Result.fail(decoded.failure)
    : timelineOf<TResourceData, TEventData>(decoded.success);
}

/** {@link decodeTimelineResult} as an Effect; nothing runs until the Effect does. */
export function decodeTimeline<TResourceData, TEventData>(
  input: TimelineInput<TResourceData, TEventData>,
): Effect.Effect<Timeline<TResourceData, TEventData>, TimelineInputError>;
export function decodeTimeline(input: unknown): Effect.Effect<Timeline, TimelineInputError>;
export function decodeTimeline(input: unknown) {
  return Effect.suspend(() => Effect.fromResult(decodeTimelineResult(input)));
}
