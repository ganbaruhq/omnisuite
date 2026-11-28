import { Command, Component } from "@effect/ui";
import {
  cancelMessageOf,
  decodeEditingResult,
  describePreviewInEnglish,
  editCapabilityOf,
  editFingerprintOf,
  editGestureLogic,
  evaluationKeyOf,
  previewDescriptionOf,
  previewLayout,
  unchangedMessageOf,
  untargetedMessageOf,
  type CalendarEvent,
  type Disambiguation,
  type EditCancelReason,
  type EditEvaluation,
  type EditGesture,
  type EditGestureContext,
  type EditOperation,
  type EditRule,
  type Editing,
  type EditingInput,
  type EventPlacement,
  type EventProposal,
  type PreviewDescription,
  type ResizeEdge,
  type Timeline,
  type TimelineInputError,
  type TimelineRow,
} from "@omnisuite/calendar-core";
import { Effect, Schema } from "effect";
import { declared, isObject, isFunction } from "./schema.js";

// The editing shared by every input: the gesture store's snapshot kept as data, the evaluation
// shown as the preview, what is announced, and what is emitted to the application. The pointer
// and the keyboard each work out an evaluation and hand it here. Nothing here touches the DOM.

const editRules = ["constraint", "overlap", "allow"] as const;

/** The editing props of a timeline, the same as calendar-react's `EditorOptions`. */
export interface EditorOptions<TEventData = unknown> {
  /** Turns editing on. Without it the timeline is read-only. */
  readonly editing?: EditingInput<TEventData> | undefined;
  /**
   * Called once when a changed, allowed destination is released or confirmed. The calendar does
   * not change the events: accept the proposal by supplying new events, or ignore it.
   */
  readonly onProposal?: ((proposal: EventProposal<TEventData>) => void) | undefined;
  /** Called, once per rule per gesture, when a rule throws; the destination counts as rejected. */
  readonly onRuleError?:
    | ((
        error: unknown,
        context: { readonly rule: EditRule; readonly proposal: EventProposal<TEventData> },
      ) => void)
    | undefined;
  /** Words for the preview's accessible description. Defaults to English. */
  readonly describe?: ((preview: PreviewDescription<TEventData>) => string) | undefined;
}

/** What an editor step tells the application, through its callbacks, once the step applies. */
export type EditorNotice =
  | { readonly _tag: "Proposed"; readonly proposal: EventProposal<any> }
  | {
      readonly _tag: "RuleFailed";
      readonly error: unknown;
      readonly rule: EditRule;
      readonly proposal: EventProposal<any>;
    };

/** Calls `onProposal` after the update that settled the gesture. */
export const NotifyProposal = Command.make(
  "NotifyProposal",
  {
    args: {
      onProposal: declared<(proposal: EventProposal<any>) => void>(isFunction),
      proposal: declared<EventProposal<any>>(isObject),
    },
  },
  ({ onProposal, proposal }) =>
    Effect.sync(() => onProposal(proposal)).pipe(Effect.as(Component.noop)),
);

/** Calls `onRuleError` after the update that evaluated the rule. */
export const NotifyRuleError = Command.make(
  "NotifyRuleError",
  {
    args: {
      onRuleError: declared<NonNullable<EditorOptions<any>["onRuleError"]>>(isFunction),
      error: Schema.Unknown,
      rule: Schema.Literals(editRules),
      proposal: declared<EventProposal<any>>(isObject),
    },
  },
  ({ onRuleError, error, rule, proposal }) =>
    Effect.sync(() => onRuleError(error, { rule, proposal })).pipe(Effect.as(Component.noop)),
);

/** The Commands that hand `notices` to the callbacks given in `options`, in order. */
export const notifyCommands = (
  options: Pick<EditorOptions<any>, "onProposal" | "onRuleError">,
  notices: readonly EditorNotice[],
) =>
  notices.flatMap((notice) => {
    if (notice._tag === "Proposed")
      return options.onProposal
        ? [NotifyProposal.make({ onProposal: options.onProposal, proposal: notice.proposal })]
        : [];
    return options.onRuleError
      ? [
          NotifyRuleError.make({
            onRuleError: options.onRuleError,
            error: notice.error,
            rule: notice.rule,
            proposal: notice.proposal,
          }),
        ]
      : [];
  });

/**
 * The fields of one timeline's editing state, to spread into its Model: calendar-core's gesture
 * snapshot (`gesture` and `cancellation`), the rules already reported in this gesture, and what
 * the last gesture ended with.
 */
export const editorFields = {
  gesture: Schema.UndefinedOr(declared<EditGesture>(isObject)),
  cancellation: Schema.UndefinedOr(
    declared<NonNullable<EditGestureContext["cancellation"]>>(isObject),
  ),
  reported: Schema.Array(Schema.Literals(editRules)),
  outcome: Schema.String,
};
export const EditorState = Schema.Struct(editorFields);
export type EditorState = typeof EditorState.Type;

// Used only for its pure `transition`: each timeline keeps its own snapshot in its model.
const gestureStore = editGestureLogic.createStore();
type GestureEvent = Parameters<typeof gestureStore.send>[0];

export const idleEditor: EditorState = {
  ...gestureStore.getSnapshot().context,
  reported: [],
  outcome: "",
};

const transition = <S extends EditorState>(state: S, event: GestureEvent): S => {
  const [next] = gestureStore.transition(
    {
      ...gestureStore.getSnapshot(),
      context: { gesture: state.gesture, cancellation: state.cancellation },
    },
    event,
  );
  return { ...state, gesture: next.context.gesture, cancellation: next.context.cancellation };
};

/** What the editor works against: the props of the timeline as they are now. */
export interface EditorContext {
  readonly timeline: Timeline<any, any>;
  readonly editing: Editing<any> | undefined;
  /** The rows shown without any preview, in order. */
  readonly rows: readonly TimelineRow<any, any>[];
  readonly describe: ((preview: PreviewDescription<any>) => string) | undefined;
}

/** The result of an editor step: the next state and what to emit, in order. */
export interface EditorStep<S extends EditorState = EditorState> {
  readonly state: S;
  readonly notices: readonly EditorNotice[];
}

const quiet = <S extends EditorState>(state: S): EditorStep<S> => ({ state, notices: [] });

const decodedEditing = new WeakMap<object, Map<string, Editing<any> | TimelineInputError>>();

/**
 * The editing options decoded, or their error, once per options object. Each update reads the
 * props as they are then, so the rules evaluated are always the ones given last.
 */
export function decodeEditing(
  editing: EditingInput<any> | undefined,
  disambiguation: Disambiguation | undefined,
): Editing<any> | TimelineInputError | undefined {
  if (!editing) return undefined;
  const byZone = decodedEditing.get(editing) ?? new Map();
  decodedEditing.set(editing, byZone);
  const key = disambiguation ?? "";
  const cached = byZone.get(key);
  if (cached) return cached;
  const result = decodeEditingResult(editing, disambiguation ? { disambiguation } : {});
  const decoded = result._tag === "Success" ? result.success : result.failure;
  byZone.set(key, decoded);
  return decoded;
}

/**
 * Identifies the editing options by value, so that options rebuilt on every render, with inline
 * rules, do not look new.
 */
export const editingKeyOf = (editing: EditingInput<any> | undefined) =>
  editing === undefined
    ? ""
    : JSON.stringify([
        editing.snap,
        editing.startEditable,
        editing.resourceEditable,
        editing.durationEditable,
        editing.constraint,
        editing.overlap !== undefined,
        editing.allow !== undefined,
      ]);

export const eventOf = (context: Pick<EditorContext, "timeline">, eventId: string) =>
  context.timeline.events.find(({ id }) => id === eventId);

/** What one event lets a gesture change under the editing given now. */
export const capabilityOf = (
  context: Pick<EditorContext, "editing">,
  event: CalendarEvent<any> | undefined,
) =>
  event
    ? editCapabilityOf(event, context.editing)
    : { time: false, resource: false, duration: false, move: false, edit: false };

export interface GestureRequest {
  readonly input: "pointer" | "keyboard";
  readonly operation: EditOperation;
  readonly eventId: string;
  readonly resourceId: string;
  /** Required for a resize. */
  readonly edge?: ResizeEdge | undefined;
}

/**
 * Starts a gesture, unless one is active or the event cannot be edited that way. Undefined when
 * it does not start.
 */
export function beginGesture<S extends EditorState>(
  state: S,
  context: EditorContext,
  request: GestureRequest,
): S | undefined {
  const event = eventOf(context, request.eventId);
  if (state.gesture || !event) return undefined;
  const capability = capabilityOf(context, event);
  if (!(request.operation === "resize" ? capability.duration && request.edge : capability.move))
    return undefined;
  return transition(
    { ...state, reported: [], outcome: "" },
    {
      type: "gestureStarted",
      input: request.input,
      operation: request.operation,
      ...(request.edge && { edge: request.edge }),
      eventId: request.eventId,
      sourceResourceId: request.resourceId,
      fingerprint: editFingerprintOf(event),
    },
  );
}

/** Points the gesture at another row. */
export const retargetGesture = <S extends EditorState>(state: S, resourceId: string): S =>
  state.gesture && state.gesture.targetResourceId !== resourceId
    ? transition(state, { type: "retargeted", resourceId })
    : state;

/** Moves a keyboard gesture by whole snap steps. */
export const stepGesture = <S extends EditorState>(state: S, by: number): S =>
  transition(state, { type: "stepped", by });

/**
 * Shows what releasing the gesture now would do, and reports a rule that threw, once per rule
 * per gesture. An evaluation that shows the same result as the current preview changes nothing.
 */
export function showEvaluation<S extends EditorState>(
  state: S,
  evaluation: EditEvaluation<any> | undefined,
): EditorStep<S> {
  const gesture = state.gesture;
  if (!gesture) return quiet(state);
  const notices: EditorNotice[] = [];
  let next = state;
  if (
    evaluation?.status === "rejected" &&
    evaluation.error !== undefined &&
    !state.reported.includes(evaluation.rule)
  ) {
    next = { ...next, reported: [...next.reported, evaluation.rule] };
    notices.push({
      _tag: "RuleFailed",
      error: evaluation.error,
      rule: evaluation.rule,
      proposal: evaluation.proposal,
    });
  }
  const preview =
    evaluation === undefined || evaluation.status === "unavailable"
      ? undefined
      : { targetResourceId: evaluation.proposal.targetResourceId, evaluation };
  if (evaluationKeyOf(preview?.evaluation) !== evaluationKeyOf(gesture.preview?.evaluation))
    next = transition(next, { type: "previewChanged", preview });
  return { state: next, notices };
}

/** Ends the gesture without a proposal, saying why. */
export function cancelGesture<S extends EditorState>(state: S, reason: EditCancelReason): S {
  const gesture = state.gesture;
  if (!gesture) return state;
  return {
    ...transition(state, { type: "gestureCanceled", reason }),
    outcome: cancelMessageOf(gesture.operation, reason),
  };
}

const describeWith = (
  context: EditorContext,
  status: PreviewDescription["status"],
  proposal: EventProposal<any>,
  rejection?: { readonly rule: EditRule; readonly error?: unknown },
) =>
  (context.describe ?? describePreviewInEnglish)(
    previewDescriptionOf(context.timeline, status, proposal, rejection),
  );

/**
 * Ends the gesture on what it would do: proposes an allowed change, and cancels a gesture with
 * no destination or a rejected one.
 */
export function settleGesture<S extends EditorState>(
  state: S,
  context: EditorContext,
  evaluation: EditEvaluation<any> | undefined,
): EditorStep<S> {
  const gesture = state.gesture;
  if (!gesture) return quiet(state);
  if (evaluation === undefined || evaluation.status === "unavailable")
    return quiet(cancelGesture(state, "invalid-target"));
  if (evaluation.status === "rejected") return quiet(cancelGesture(state, "rejected"));
  const ended = transition(state, { type: "gestureEnded" });
  if (evaluation.status === "unchanged")
    return quiet({
      ...ended,
      outcome: unchangedMessageOf(gesture.operation, evaluation.proposal.after.title),
    });
  return {
    state: { ...ended, outcome: describeWith(context, "allowed", evaluation.proposal) },
    notices: [{ _tag: "Proposed", proposal: evaluation.proposal }],
  };
}

/**
 * Checks the gesture against new props: it is cancelled when editing was turned off, or the
 * dragged event is gone or different. `current` is true when the gesture goes on and should be
 * evaluated again.
 */
export function reconcileGesture<S extends EditorState>(
  state: S,
  context: EditorContext | undefined,
): { readonly state: S; readonly current: boolean } {
  const gesture = state.gesture;
  if (!gesture) return { state, current: false };
  if (!context?.editing) return { state: cancelGesture(state, "event-changed"), current: false };
  const event = eventOf(context, gesture.eventId);
  if (!event) return { state: cancelGesture(state, "event-removed"), current: false };
  if (editFingerprintOf(event) !== gesture.fingerprint)
    return { state: cancelGesture(state, "event-changed"), current: false };
  return { state, current: true };
}

/** The destination preview in the row it lands in. */
export interface EditorPreview {
  readonly resourceId: string;
  /** The preview in its lane, or undefined when the destination lies outside the visible range. */
  readonly placement: EventPlacement<any> | undefined;
  readonly status: PreviewDescription["status"];
  readonly rule: EditRule | undefined;
  readonly description: string;
}

/** What the view of an editable timeline reads, the same as calendar-react's `TimelineEditor`. */
export interface TimelineEditor {
  readonly gesture: EditGesture | undefined;
  /** Why the last gesture was cancelled, until another begins. */
  readonly cancellation: EditCancelReason | undefined;
  readonly preview: EditorPreview | undefined;
  /** What to announce: the destination while editing, then how the gesture ended. */
  readonly message: string;
  /** Whether the event can be edited at all: moved or resized. */
  canEdit(event: CalendarEvent<any>): boolean;
  /** Whether the event can be moved, in time or to another resource. */
  canMove(event: CalendarEvent<any>): boolean;
  /** Whether either edge of the event can be resized. */
  canResize(event: CalendarEvent<any>): boolean;
}

/**
 * The editor as the view sees it, and the rows with the target row laid out around the preview;
 * the dragged rendering stays in its row, to be hidden.
 */
export function editorViewOf(
  state: EditorState,
  context: EditorContext,
): { readonly editor: TimelineEditor; readonly rows: readonly TimelineRow<any, any>[] } {
  const { gesture, cancellation } = state;
  const evaluation = gesture?.preview?.evaluation;
  const layout = evaluation ? previewLayout(context.timeline, evaluation.proposal) : undefined;
  const rows =
    gesture && layout
      ? context.rows.map((row) => {
          if (row.kind !== "resource" || row.resource.id !== layout.resourceId) return row;
          const original =
            gesture.sourceResourceId === row.resource.id
              ? row.placements.filter(({ occurrenceId }) => occurrenceId === gesture.occurrenceId)
              : [];
          return {
            ...row,
            laneCount: layout.laneCount,
            placements: [...layout.placements, ...original],
          };
        })
      : context.rows;
  const rejection =
    evaluation?.status === "rejected"
      ? { rule: evaluation.rule, error: evaluation.error }
      : undefined;
  const preview: EditorPreview | undefined =
    layout && evaluation
      ? {
          resourceId: layout.resourceId,
          placement: layout.preview,
          status: evaluation.status,
          rule: rejection?.rule,
          description: describeWith(context, evaluation.status, evaluation.proposal, rejection),
        }
      : undefined;
  const message = gesture
    ? (preview?.description ??
      untargetedMessageOf(gesture.operation, eventOf(context, gesture.eventId)?.title ?? ""))
    : state.outcome;
  return {
    editor: {
      gesture,
      cancellation: cancellation?.reason,
      preview,
      message,
      canEdit: (event) => editCapabilityOf(event, context.editing).edit,
      canMove: (event) => editCapabilityOf(event, context.editing).move,
      canResize: (event) => editCapabilityOf(event, context.editing).duration,
    },
    rows,
  };
}
