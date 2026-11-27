import { createStoreLogic } from "@xstate/store";
import type { EditEvaluation, ResizeEdge } from "./editing.js";
import { occurrenceIdOf } from "./timeline.js";

/** Whether a gesture moves an event or resizes one of its edges. */
export type EditOperation = "move" | "resize";

/** Why a gesture ended without a proposal that the application could accept. */
export type EditCancelReason =
  /** The user pressed Escape. */
  | "escape"
  /** It was released, or confirmed, where no resource row is a target. */
  | "invalid-target"
  /** It was released on a destination that the editing rules reject. */
  | "rejected"
  /** The dragged event is no longer supplied. */
  | "event-removed"
  /** Keyboard only: focus left the event while it was being moved. */
  | "blur"
  /** The dragged event changed under the gesture, so a proposal would be stale. */
  | "event-changed";

/** What releasing the gesture now would do. Nothing is emitted unless it is `allowed`. */
export interface GesturePreview<TEventData = unknown> {
  readonly targetResourceId: string;
  readonly evaluation: Exclude<EditEvaluation<TEventData>, { readonly status: "unavailable" }>;
}

export interface EditGesture<TEventData = unknown> {
  readonly input: "pointer" | "keyboard";
  readonly operation: EditOperation;
  /** The edge being dragged, for a resize. */
  readonly edge: ResizeEdge | undefined;
  readonly eventId: string;
  /** The resource whose rendering is dragged. */
  readonly sourceResourceId: string;
  readonly occurrenceId: string;
  /** Identifies the dragged event's values as they were supplied when the gesture began. */
  readonly fingerprint: string;
  /** Keyboard only: whole snap steps the event, or the edge being resized, has been moved. */
  readonly steps: number;
  /**
   * Keyboard only: the row the event has been moved to; the source row until it is moved, and for
   * a resize always.
   */
  readonly targetResourceId: string;
  readonly preview: GesturePreview<TEventData> | undefined;
}

export interface EditGestureContext<TEventData = unknown> {
  /** The active gesture, undefined while the calendar is idle. */
  readonly gesture: EditGesture<TEventData> | undefined;
  /** The last gesture that was cancelled, until another begins. */
  readonly cancellation:
    | {
        readonly eventId: string;
        readonly operation: EditOperation;
        readonly reason: EditCancelReason;
      }
    | undefined;
}

/**
 * The transient state of one calendar's editing: the active gesture, where it would land, and
 * why the last one was cancelled. These are pure transitions with no React and no DOM; each
 * calendar creates its own store from this logic. The store never holds accepted events: the
 * application owns those, and a preview is only a proposal that has not been accepted.
 */
export const editGestureLogic = createStoreLogic({
  context: (): EditGestureContext => ({ gesture: undefined, cancellation: undefined }),
  // A transition returns the whole next context, not a part of it.
  on: {
    gestureStarted: (
      context,
      event: {
        readonly input: "pointer" | "keyboard";
        readonly operation: EditOperation;
        /** Required for a resize. */
        readonly edge?: ResizeEdge;
        readonly eventId: string;
        readonly sourceResourceId: string;
        readonly fingerprint: string;
      },
    ) =>
      context.gesture
        ? context
        : {
            cancellation: undefined,
            gesture: {
              input: event.input,
              operation: event.operation,
              edge: event.edge,
              eventId: event.eventId,
              sourceResourceId: event.sourceResourceId,
              occurrenceId: occurrenceIdOf(event.eventId, event.sourceResourceId),
              fingerprint: event.fingerprint,
              steps: 0,
              targetResourceId: event.sourceResourceId,
              preview: undefined,
            },
          },
    previewChanged: (context, event: { readonly preview: GesturePreview | undefined }) =>
      context.gesture
        ? { ...context, gesture: { ...context.gesture, preview: event.preview } }
        : context,
    stepped: (context, event: { readonly by: number }) =>
      context.gesture
        ? { ...context, gesture: { ...context.gesture, steps: context.gesture.steps + event.by } }
        : context,
    retargeted: (context, event: { readonly resourceId: string }) =>
      context.gesture
        ? { ...context, gesture: { ...context.gesture, targetResourceId: event.resourceId } }
        : context,
    gestureEnded: (context) => (context.gesture ? { ...context, gesture: undefined } : context),
    gestureCanceled: (context, event: { readonly reason: EditCancelReason }) =>
      context.gesture
        ? {
            gesture: undefined,
            cancellation: {
              eventId: context.gesture.eventId,
              operation: context.gesture.operation,
              reason: event.reason,
            },
          }
        : context,
  },
});
