import {
  editCapabilityOf,
  evaluateMove,
  evaluateResize,
  type EditEvaluation,
  type EditRule,
  type Editing,
  type EventProposal,
  type MoveShift,
  type ResizeEdge,
} from "./editing.js";
import { editFingerprintOf } from "./edit-text.js";
import type { EditGesture, EditOperation, GestureStart } from "./gesture.js";
import type { Timeline, TimelineRow } from "./timeline.js";

// The steps of an editing gesture that every renderer takes the same way, whatever the input:
// when a gesture may begin, step or change rows, what it would do now, and which rule error it
// still has to report. Renderers measure their input and keep the gesture store; these decide.

/** A gesture a renderer asks to begin on one rendering of an event. */
export interface GestureRequest {
  readonly input: "pointer" | "keyboard";
  readonly operation: EditOperation;
  readonly eventId: string;
  /** The resource whose rendering the gesture begins on. */
  readonly resourceId: string;
  /** Required for a resize. */
  readonly edge?: ResizeEdge | undefined;
}

const eventIn = (timeline: Pick<Timeline<any, any>, "events">, eventId: string) =>
  timeline.events.find(({ id }) => id === eventId);

/**
 * The `gestureStarted` event that begins `request`, or undefined when it may not begin: another
 * gesture is `active`, editing is off, the event is not supplied, or the event cannot be edited
 * that way (a move needs it movable, a resize needs its duration editable and an edge).
 */
export function gestureStartOf(
  timeline: Pick<Timeline<any, any>, "events">,
  editing: Editing<any> | undefined,
  active: EditGesture<any> | undefined,
  request: GestureRequest,
): GestureStart | undefined {
  const event = eventIn(timeline, request.eventId);
  if (active || !event) return undefined;
  const capability = editCapabilityOf(event, editing);
  const allowed =
    request.operation === "resize"
      ? capability.duration && request.edge !== undefined
      : capability.move;
  if (!allowed) return undefined;
  return {
    input: request.input,
    operation: request.operation,
    ...(request.edge && { edge: request.edge }),
    eventId: request.eventId,
    sourceResourceId: request.resourceId,
    fingerprint: editFingerprintOf(event),
  };
}

/**
 * Whether a keyboard step may move the gesture along the time axis: a move needs the event's time
 * editable, a resize its duration.
 */
export function canStepGesture(
  timeline: Pick<Timeline<any, any>, "events">,
  editing: Editing<any> | undefined,
  gesture: EditGesture<any>,
): boolean {
  const event = eventIn(timeline, gesture.eventId);
  if (!event) return false;
  const capability = editCapabilityOf(event, editing);
  return gesture.operation === "resize" ? capability.duration : capability.time;
}

/**
 * The resource row a keyboard move goes to, `by` rows from the row it is over among the `rows`
 * shown, skipping group headings. Undefined when there is no such row, for a resize, which keeps
 * its row, and for an event that cannot change resource.
 */
export function gestureRowOf(
  timeline: Pick<Timeline<any, any>, "events">,
  editing: Editing<any> | undefined,
  rows: readonly TimelineRow<any, any>[],
  gesture: EditGesture<any>,
  by: number,
): string | undefined {
  if (gesture.operation !== "move") return undefined;
  const event = eventIn(timeline, gesture.eventId);
  if (!event || !editCapabilityOf(event, editing).resource) return undefined;
  const ids = rows.flatMap((row) => (row.kind === "resource" ? [row.resource.id] : []));
  const at = ids.indexOf(gesture.targetResourceId);
  return at < 0 ? undefined : ids[at + by];
}

/** Where a gesture is now, as its input measured it. */
export interface GesturePosition {
  /** How far the event, or the edge being resized, has moved; omitted when it has not. */
  readonly shift?: MoveShift | undefined;
  /** The resource row a move is over; undefined over none. A resize keeps its own row. */
  readonly targetResourceId: string | undefined;
}

/**
 * What releasing or confirming the gesture at `position` would do; undefined while a move is over
 * no resource row. A resize follows the shift along the time axis wherever the target is.
 */
export function evaluateGesture(
  timeline: Timeline<any, any>,
  editing: Editing<any> | undefined,
  gesture: EditGesture<any>,
  position: GesturePosition,
): EditEvaluation<any> | undefined {
  const shift = position.shift && { shift: position.shift };
  if (gesture.operation === "resize")
    return gesture.edge
      ? evaluateResize(timeline, editing, {
          eventId: gesture.eventId,
          resourceId: gesture.sourceResourceId,
          edge: gesture.edge,
          ...shift,
        })
      : undefined;
  return position.targetResourceId === undefined
    ? undefined
    : evaluateMove(timeline, editing, {
        eventId: gesture.eventId,
        sourceResourceId: gesture.sourceResourceId,
        targetResourceId: position.targetResourceId,
        ...shift,
      });
}

/** A rule that threw while a gesture was evaluated; the destination counts as rejected. */
export interface RuleError<TEventData = unknown> {
  readonly error: unknown;
  readonly rule: EditRule;
  readonly proposal: EventProposal<TEventData>;
}

/**
 * The rule error `evaluation` should report: a rule threw and `gesture` has not reported that
 * rule yet. Report it, then send `ruleReported` so the rest of the gesture stays quiet about it.
 */
export function unreportedRuleErrorOf<TEventData>(
  gesture: EditGesture<any> | undefined,
  evaluation: EditEvaluation<TEventData> | undefined,
): RuleError<TEventData> | undefined {
  if (
    !gesture ||
    evaluation?.status !== "rejected" ||
    evaluation.error === undefined ||
    gesture.reportedRules.includes(evaluation.rule)
  )
    return undefined;
  return { error: evaluation.error, rule: evaluation.rule, proposal: evaluation.proposal };
}
