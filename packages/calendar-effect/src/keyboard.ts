import { UiSchema } from "@effect/ui";
import type { Html } from "@effect/ui/html";
import {
  evaluateMove,
  evaluateResize,
  occurrenceIdOf,
  resizableEdgesOf,
  type EditEvaluation,
  type EditGesture,
  type EventPlacement,
  type ResizeEdge,
} from "@omnisuite/calendar-core";
import { Schema } from "effect";
import {
  beginGesture,
  cancelGesture,
  capabilityOf,
  eventOf,
  retargetGesture,
  settleGesture,
  showEvaluation,
  stepGesture,
  type EditorContext,
  type EditorState,
  type EditorStep,
  type TimelineEditor,
} from "./editor.js";

// Keyboard editing, as calendar-react's `Event` part does it: Enter or Space picks the focused
// event up and drops it, the arrows move it by a snap step or a row, Alt or Shift with an arrow
// resizes its start or end edge, and Escape or leaving the event cancels. The event part turns
// keys into actions; `applyKeyboardAction` turns them into the gesture through the editor.

const edges = ["start", "end"] as const;

/** What a key on a focused event asks for. */
export const KeyboardAction = UiSchema.TaggedEnum({
  /** Picks the event up to move it. */
  Started: { eventId: Schema.String, resourceId: Schema.String },
  /** Picks one edge of the event up, and moves it at once by `by` snap steps. */
  StartedResize: {
    eventId: Schema.String,
    resourceId: Schema.String,
    edge: Schema.Literals(edges),
    by: Schema.Number,
  },
  /** Moves the event, or the edge being resized, by whole snap steps. */
  Stepped: { by: Schema.Number },
  /** Moves the event to the resource row `by` rows away, skipping group headings. */
  MovedRow: { by: Schema.Number },
  Confirmed: {},
  Cancelled: { reason: Schema.Literals(["escape", "blur"]) },
});
export type KeyboardAction = typeof KeyboardAction.Type;

/** What the event part reads to decide what a key on one occurrence does. */
export interface KeyboardTarget {
  readonly placement: EventPlacement;
  readonly editor: TimelineEditor;
}

const sideways: Readonly<Record<string, number>> = { ArrowRight: 1, ArrowLeft: -1 };

/**
 * The action a key pressed on an editable occurrence asks for, or undefined when the key is the
 * page's: the occurrence then does not prevent its default. Keys typed into a field inside the
 * event, and keys that compose text, are left alone.
 */
export function keyboardActionOf(
  key: Html.KeyPayload,
  { placement, editor }: KeyboardTarget,
): KeyboardAction | undefined {
  if (key.editable || key.composing) return undefined;
  const gesture = editor.gesture;
  const editing = gesture?.occurrenceId === placement.occurrenceId && gesture.input === "keyboard";
  const confirm = key.key === "Enter" || key.key === " ";
  const by = sideways[key.key];
  if (!editing) {
    if (gesture) return undefined;
    if (confirm)
      return editor.canMove(placement.event)
        ? KeyboardAction.Started({
            eventId: placement.event.id,
            resourceId: placement.resourceId,
          })
        : undefined;
    if (by === undefined || key.ctrl || key.meta) return undefined;
    // Alt takes the start edge and Shift the end edge, so a narrow event needs no handle.
    const edge: ResizeEdge | undefined = key.alt ? "start" : key.shift ? "end" : undefined;
    if (!edge || !resizableEdgesOf(placement, editor.canResize(placement.event))[edge])
      return undefined;
    return KeyboardAction.StartedResize({
      eventId: placement.event.id,
      resourceId: placement.resourceId,
      edge,
      by,
    });
  }
  if (confirm) return KeyboardAction.Confirmed();
  if (key.key === "Escape") return KeyboardAction.Cancelled({ reason: "escape" });
  if (by !== undefined) return KeyboardAction.Stepped({ by });
  if (key.key === "ArrowDown") return KeyboardAction.MovedRow({ by: 1 });
  if (key.key === "ArrowUp") return KeyboardAction.MovedRow({ by: -1 });
  return undefined;
}

/** The action leaving an occurrence asks for: a keyboard gesture on it is cancelled. */
export const blurActionOf = ({ placement, editor }: KeyboardTarget): KeyboardAction | undefined =>
  editor.gesture?.occurrenceId === placement.occurrenceId && editor.gesture.input === "keyboard"
    ? KeyboardAction.Cancelled({ reason: "blur" })
    : undefined;

/** The keys an occurrence answers to, for `aria-keyshortcuts`. */
export const keyShortcutsOf = ({ placement, editor }: KeyboardTarget): string => {
  const edges = resizableEdgesOf(placement, editor.canResize(placement.event));
  return [
    editor.canMove(placement.event) && "Enter Space",
    edges.start && "Alt+ArrowLeft Alt+ArrowRight",
    edges.end && "Shift+ArrowLeft Shift+ArrowRight",
  ]
    .filter(Boolean)
    .join(" ");
};

/** What confirming the keyboard gesture now would do. */
export function evaluateKeyboard(
  context: EditorContext,
  gesture: EditGesture,
): EditEvaluation<any> {
  const shift = gesture.steps !== 0 ? { steps: gesture.steps } : undefined;
  return gesture.operation === "resize" && gesture.edge
    ? evaluateResize(context.timeline, context.editing, {
        eventId: gesture.eventId,
        resourceId: gesture.sourceResourceId,
        edge: gesture.edge,
        ...(shift && { shift }),
      })
    : evaluateMove(context.timeline, context.editing, {
        eventId: gesture.eventId,
        sourceResourceId: gesture.sourceResourceId,
        targetResourceId: gesture.targetResourceId,
        ...(shift && { shift }),
      });
}

const quiet = <S extends EditorState>(state: S): KeyboardStep<S> => ({ state, notices: [] });

/** Shows the keyboard gesture again, as after the props changed. */
export const reevaluateKeyboard = <S extends EditorState>(
  state: S,
  context: EditorContext,
): EditorStep<S> =>
  state.gesture?.input === "keyboard"
    ? showEvaluation(state, evaluateKeyboard(context, state.gesture))
    : quiet(state);

/**
 * An editor step from the keyboard, and the occurrence that should have the focus once the
 * application has applied what was proposed: the moved event's rendering in its new row.
 */
export interface KeyboardStep<S extends EditorState = EditorState> extends EditorStep<S> {
  readonly focus?: string;
}

/** The next state after a key on an occurrence. */
export function applyKeyboardAction<S extends EditorState>(
  state: S,
  context: EditorContext,
  action: KeyboardAction,
): KeyboardStep<S> {
  const gesture = state.gesture;
  switch (action._tag) {
    case "Started": {
      const started = beginGesture(state, context, {
        input: "keyboard",
        operation: "move",
        ...action,
      });
      return started ? reevaluateKeyboard(started, context) : quiet(state);
    }
    case "StartedResize": {
      const started = beginGesture(state, context, {
        input: "keyboard",
        operation: "resize",
        eventId: action.eventId,
        resourceId: action.resourceId,
        edge: action.edge,
      });
      return started
        ? applyKeyboardAction(started, context, KeyboardAction.Stepped({ by: action.by }))
        : quiet(state);
    }
    case "Stepped": {
      if (gesture?.input !== "keyboard") return quiet(state);
      const capability = capabilityOf(context, eventOf(context, gesture.eventId));
      if (!(gesture.operation === "resize" ? capability.duration : capability.time))
        return quiet(state);
      return reevaluateKeyboard(stepGesture(state, action.by), context);
    }
    case "MovedRow": {
      // A resize keeps its row.
      if (gesture?.input !== "keyboard" || gesture.operation !== "move") return quiet(state);
      if (!capabilityOf(context, eventOf(context, gesture.eventId)).resource) return quiet(state);
      const ids = context.rows.flatMap((row) => (row.kind === "resource" ? [row.resource.id] : []));
      const at = ids.indexOf(gesture.targetResourceId);
      const next = ids[at + action.by];
      if (at < 0 || next === undefined) return quiet(state);
      return reevaluateKeyboard(retargetGesture(state, next), context);
    }
    case "Confirmed": {
      if (gesture?.input !== "keyboard") return quiet(state);
      // Worked out again, so that what is proposed is what the events are now.
      const evaluation = evaluateKeyboard(context, gesture);
      const step = settleGesture(state, context, evaluation);
      return step.notices.some(({ _tag }) => _tag === "Proposed") && evaluation.status === "allowed"
        ? { ...step, focus: occurrenceIdOf(gesture.eventId, evaluation.proposal.targetResourceId) }
        : step;
    }
    case "Cancelled":
      return gesture?.input === "keyboard"
        ? quiet(cancelGesture(state, action.reason))
        : quiet(state);
  }
}
