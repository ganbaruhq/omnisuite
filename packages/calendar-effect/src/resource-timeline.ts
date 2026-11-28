import { Mount, Subscription, UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import {
  collapsedIdsOf,
  decodeTimelineResult,
  disclosureDescriptionOf,
  disclosureLabelOf,
  expansionToggleOf,
  laneLabelOf,
  placementBoxOf,
  resizableEdgesOf,
  resourceHierarchyLogic,
  TimelineInputError,
  slotBoxOf,
  visibleTimelineRows,
  windowAttemptOf,
  windowLoadingLogic,
  windowStateOf,
  type CalendarEventInput,
  type CalendarNodeInput,
  type EditingInput,
  type EventPlacement,
  type EventProposal,
  type PreviewDescription,
  type ResizeEdge,
  type Timeline,
  type TimelineGroupRow,
  type TimelineResourceRow,
  type TimelineRow,
  type TimelineSlot,
  type TimelineWindow,
  type WindowState,
} from "@omnisuite/calendar-core";
import { Schema, Stream } from "effect";
import {
  decodeEditing,
  editingKeyOf,
  editorFields,
  editorViewOf,
  idleEditor,
  notifyCommands,
  reconcileGesture,
  type EditorContext,
  type EditorOptions,
  type EditorPreview,
  type EditorStep,
  type TimelineEditor,
} from "./editor.js";
import { flag, withStyle } from "./host.js";
import {
  applyPointerFact,
  PointerFact,
  PointerPosition,
  reevaluatePointer,
  TimelinePointer,
} from "./pointer.js";
import { loadWindow, windowOf, type WindowLoadingOptions } from "./window-loading.js";

const declared = <T>(is: (u: unknown) => boolean) => Schema.declare((u): u is T => is(u));
const isArray = (u: unknown) => Array.isArray(u);
const isObject = (u: unknown) => typeof u === "object" && u !== null;
const isFunction = (u: unknown) => typeof u === "function";

/**
 * The props of a {@link ResourceTimeline}: the same input as calendar-react's
 * `useResourceTimeline`, read-only. `resources`, `events` and `loading` are kept as given, so the
 * timeline is laid out again only when one of them, or the range, slot duration, time zone or
 * disambiguation, changes.
 */
export const ResourceTimelineProps = Schema.Struct({
  range: Schema.Struct({ start: Schema.String, end: Schema.String }),
  slotDuration: Schema.String,
  timeZone: Schema.optional(Schema.String),
  disambiguation: Schema.optional(Schema.Literals(["compatible", "earlier", "later", "reject"])),
  resources: declared<readonly CalendarNodeInput[]>(isArray),
  events: declared<readonly CalendarEventInput[]>(isArray),
  /**
   * Turns window loading on: the timeline signals the window it needs to `onLoadWindow` and
   * reports what `coverage` says about it. Without it the supplied events are all there is.
   */
  loading: Schema.optional(declared<WindowLoadingOptions>(isObject)),
  /**
   * Turns editing on: events move by dragging them and resize by their `resizeHandle`s. Without
   * it the timeline is read-only. Invalid options make the timeline `invalid`.
   */
  editing: Schema.optional(declared<EditingInput<any>>(isObject)),
  /**
   * Called once when a changed, allowed destination is released. The calendar does not change
   * the events: accept the proposal by supplying new events, or ignore it.
   */
  onProposal: Schema.optional(declared<(proposal: EventProposal<any>) => void>(isFunction)),
  /** Called, once per rule per gesture, when a rule throws; the destination counts as rejected. */
  onRuleError: Schema.optional(declared<NonNullable<EditorOptions["onRuleError"]>>(isFunction)),
  /** Words for the preview's accessible description. Defaults to English. */
  describe: Schema.optional(declared<(preview: PreviewDescription<any>) => string>(isFunction)),
});
export type ResourceTimelineProps = typeof ResourceTimelineProps.Type;

// The snapshots of calendar-core's stores, as data: the viewer's expansion, the retries asked
// for each window, the attempt last signalled for each window, and the edit gesture with where
// the pointer is while it follows one.
const Model = Schema.Struct({
  collapsedIds: Schema.Array(Schema.String),
  expandedIds: Schema.Array(Schema.String),
  retries: Schema.Record(Schema.String, Schema.Number),
  signalled: Schema.Record(Schema.String, Schema.Number),
  ...editorFields,
  pointer: Schema.NullOr(PointerPosition),
});
type Model = typeof Model.Type;

const Message = UiSchema.TaggedEnum({
  ClickedDisclosure: { id: Schema.String },
  ClickedRetryWindow: {},
  SignalledWindow: { key: Schema.String, attempt: Schema.Number },
  Pointer: { fact: PointerFact },
  /** The props may have changed under a gesture. */
  Reconciled: {},
});

// Used only for their pure `transition`: each instance keeps its own snapshot in its model.
const hierarchyStore = resourceHierarchyLogic.createStore();
const windowStore = windowLoadingLogic.createStore();

type HierarchyEvent = Parameters<typeof hierarchyStore.send>[0];
type WindowEvent = Parameters<typeof windowStore.send>[0];

const expansionOf = (model: Model) => ({
  collapsedIds: new Set(model.collapsedIds),
  expandedIds: new Set(model.expandedIds),
});

const transitionHierarchy = (model: Model, event: HierarchyEvent): Model => {
  const [next] = hierarchyStore.transition(
    { ...hierarchyStore.getSnapshot(), context: expansionOf(model) },
    event,
  );
  return {
    ...model,
    collapsedIds: [...next.context.collapsedIds],
    expandedIds: [...next.context.expandedIds],
  };
};

const transitionWindows = (model: Model, event: WindowEvent): Model => {
  const [next] = windowStore.transition(
    { ...windowStore.getSnapshot(), context: { retries: model.retries } },
    event,
  );
  return { ...model, retries: next.context.retries };
};

/**
 * Applies an editor step: the next Model, with the pointer forgotten once no gesture follows
 * it, and the application's callbacks called once the step applies.
 */
const applied = <Next>(
  $: {
    readonly model: Model;
    readonly props: ResourceTimelineProps;
    set(model: Model): Next;
  },
  step: EditorStep<Model>,
) => {
  const state =
    step.state.gesture || step.state.pointer === null
      ? step.state
      : { ...step.state, pointer: null };
  if (step.notices.length === 0) return state === $.model ? $.model : $.set(state);
  const next = $.set(state) as Next & { run(...commands: ReturnType<typeof notifyCommands>): Next };
  return next.run(...notifyCommands($.props, step.notices));
};

type Decoded = ReturnType<typeof decodeTimelineResult>;

// Decoding is pure; it runs again only when the input changes. Each pair of `resources` and
// `events` arrays keeps the last few layouts, so going back to a range is not decoded again.
const decodedCache = new WeakMap<object, WeakMap<object, Map<string, Decoded>>>();
const cachedLayouts = 8;

const decode = (props: ResourceTimelineProps): Decoded => {
  const byEvents = decodedCache.get(props.resources) ?? new WeakMap<object, Map<string, Decoded>>();
  decodedCache.set(props.resources, byEvents);
  const byKey = byEvents.get(props.events) ?? new Map<string, Decoded>();
  byEvents.set(props.events, byKey);
  const key = JSON.stringify([
    props.range.start,
    props.range.end,
    props.slotDuration,
    props.timeZone,
    props.disambiguation,
  ]);
  const cached = byKey.get(key);
  if (cached) return cached;
  const result = decodeTimelineResult({
    range: { start: props.range.start, end: props.range.end },
    slotDuration: props.slotDuration,
    timeZone: props.timeZone,
    disambiguation: props.disambiguation,
    resources: props.resources,
    events: props.events,
  });
  byKey.set(key, result);
  if (byKey.size > cachedLayouts) byKey.delete(byKey.keys().next().value!);
  return result;
};

const percent = (value: number) => `${value}%`;

/** Editing, decoded: undefined without it, or the error of invalid options. */
const editingOf = (props: ResourceTimelineProps) =>
  decodeEditing(props.editing, props.disambiguation);

/** What the editor works against now; undefined unless the timeline and the editing are valid. */
const editorContextOf = (props: ResourceTimelineProps, model: Model): EditorContext | undefined => {
  const result = decode(props);
  const editing = editingOf(props);
  if (result._tag !== "Success" || !editing || editing instanceof TimelineInputError)
    return undefined;
  const timeline = result.success;
  return {
    timeline,
    editing,
    rows: visibleTimelineRows(timeline.rows, collapsedIdsOf(timeline.rows, expansionOf(model))),
    describe: props.describe,
  };
};

// Numbers each layout, so a subscription can tell a new one from the same one.
const layoutIds = new WeakMap<object, number>();
let lastLayoutId = 0;
const layoutIdOf = (result: Decoded) => {
  const known = layoutIds.get(result);
  if (known !== undefined) return known;
  layoutIds.set(result, ++lastLayoutId);
  return lastLayoutId;
};

/** The window the timeline needs now, and what the application knows about it. */
export interface ResourceTimelineLoading<TError = unknown> {
  readonly window: TimelineWindow;
  readonly state: WindowState<TError>;
}

/**
 * A headless, read-only resource timeline on calendar-core, with the parts and markup of
 * calendar-react's `ResourceTimeline`. Call it with the consumer's `h` and a `view` closure. When
 * the input is valid, `status` is `"ready"` and the view draws the parts:
 *
 * - `root(h.div)` sets `--timeline-span`, the width of the range in slot units.
 * - `viewport(h.div)` is the focusable scroll container.
 * - `axis(h.div)` positions `axisSlot(h.div, slot)` for each of `timeline.slots`.
 * - For each of `visibleRows`, `resourceRow(h.div, row)` or `groupRow(h.div, row)`, with
 *   `disclosure(h.button, row)` (undefined for a row without children) and, for a resource,
 *   `lane(h.div, row)` holding `event(h.div, placement)` for each of `row.placements`.
 * - `windowStatus(h.div)` is a live region for `loading`, and `retry(h.button)` asks for a
 *   failed window again; both are undefined without `loading`.
 *
 * Invalid input is `status: "invalid"` with the error, rather than thrown. Key the rows by
 * `row.resource.id` and the events by `placement.occurrenceId`.
 *
 * With `loading`, the window the timeline shows is signalled to `onLoadWindow` once for each
 * window it shows, and again for a failed window after `retry`. The observation ends when the
 * window changes or the timeline goes away. An error the observer throws fails the timeline.
 */
export const ResourceTimeline = Html.component({
  name: "ResourceTimeline",
  props: ResourceTimelineProps,
  model: Model,
  message: Message,
}).make({
  init: () => ({
    collapsedIds: [],
    expandedIds: [],
    retries: {},
    signalled: {},
    ...idleEditor,
    pointer: null,
  }),
  update: {
    ClickedDisclosure: ($, { id }) => {
      const result = decode($.props);
      if (result._tag !== "Success") return $.model;
      const rows = result.success.rows;
      const toggle = expansionToggleOf(rows, collapsedIdsOf(rows, expansionOf($.model)), id);
      return toggle ? transitionHierarchy($.model, { type: "setExpanded", ...toggle }) : $.model;
    },
    ClickedRetryWindow: ($) => {
      const window = windowOf(decode($.props), $.props.loading);
      if (!window || windowStateOf($.props.loading?.coverage ?? {}, window).status !== "failed")
        return $.model;
      return transitionWindows($.model, { type: "retryRequested", key: window.key });
    },
    SignalledWindow: ($, { key, attempt }) =>
      $.evolve({ signalled: (signalled) => ({ ...signalled, [key]: attempt }) }),
    Pointer: ($, { fact }) => {
      const context = editorContextOf($.props, $.model);
      return context ? applied($, applyPointerFact($.model, context, fact)) : $.model;
    },
    Reconciled: ($) => {
      const context = editorContextOf($.props, $.model);
      const { state, current } = reconcileGesture($.model, context);
      // The keyboard's gesture is evaluated again by its own input, as the pointer's is here.
      return applied(
        $,
        current && context ? reevaluatePointer(state, context) : { state, notices: [] },
      );
    },
  },
  subscriptions: ({ model, props }) => {
    // A change to the events or the rules under a gesture cancels it when the dragged event is
    // gone or different, and otherwise shows what the gesture does now.
    const reconciling = model.gesture
      ? [
          Subscription.make("edit", [layoutIdOf(decode(props)), editingKeyOf(props.editing)], () =>
            Stream.concat(Stream.make(Message.Reconciled()), Stream.never),
          ),
        ]
      : [];
    const window = windowOf(decode(props), props.loading);
    const onLoadWindow = props.loading?.onLoadWindow;
    if (!window || !onLoadWindow) return reconciling;
    const attempt = windowAttemptOf(model.retries, window.key);
    return [
      ...reconciling,
      Subscription.make("window", [window.key, attempt], () =>
        loadWindow({
          window,
          attempt,
          signalled: model.signalled,
          onLoadWindow,
          signal: (key, attempt) => Message.SignalledWindow({ key, attempt }),
        }),
      ),
    ];
  },
  parts: (p, model) => {
    const result = decode(p.props);
    const timeline = result._tag === "Success" ? result.success : undefined;
    const collapsedIds = timeline
      ? collapsedIdsOf(timeline.rows, expansionOf(model))
      : new Set(model.collapsedIds);
    const baseRows = timeline ? visibleTimelineRows(timeline.rows, collapsedIds) : [];
    const editing = editingOf(p.props);
    const context: EditorContext | undefined =
      timeline && editing && !(editing instanceof TimelineInputError)
        ? { timeline, editing, rows: baseRows, describe: p.props.describe }
        : undefined;
    const edited = context ? editorViewOf(model, context) : undefined;
    const editor = edited?.editor;
    const visibleRows = edited?.rows ?? baseRows;
    const laneCounts = new Map<string, number>();
    for (const row of visibleRows)
      if (row.kind === "resource") laneCounts.set(row.resource.id, row.laneCount);
    const window = windowOf(result, p.props.loading);
    const loading: ResourceTimelineLoading | undefined = window && {
      window,
      state: windowStateOf(p.props.loading?.coverage ?? {}, window),
    };
    const span = timeline?.span ?? 1;

    const gesture = editor?.gesture;
    const root = p.part("div", (b) => {
      const built = withStyle(
        b.attrs({
          "data-timeline-root": "",
          "data-gesture": gesture?.input,
          "data-operation": gesture?.operation,
          "data-cancel-reason": editor?.cancellation,
        }),
        { "--timeline-span": String(span) },
      );
      return editor
        ? built.onMount(
            TimelinePointer({
              span,
              source: gesture?.input === "pointer" ? gesture.sourceResourceId : null,
            }).pipe(Mount.map((fact) => Message.Pointer({ fact }))),
          )
        : built;
    });
    const viewport = p.part("div", (b) =>
      withStyle(b.attrs({ "data-timeline-viewport": "", tabindex: "0" }), { overflow: "auto" }),
    );
    const axis = p.part("div", (b) =>
      withStyle(b.attr("data-timeline-axis", ""), { position: "relative" }),
    );
    const axisSlot = p.part("div", (b, slot: TimelineSlot) => {
      const box = slotBoxOf({ span }, slot);
      return withStyle(
        b.attrs({ "data-timeline-slot": "", "data-repeated": flag(slot.repeated) }),
        {
          position: "absolute",
          insetBlock: "0",
          insetInlineStart: percent(box.inlineStart),
          width: percent(box.inlineSize),
        },
      );
    });
    const resourceRow = p.part("div", (b, row: TimelineResourceRow) =>
      b.attrs({
        role: "group",
        "aria-label": row.resource.title,
        "data-timeline-row": "",
        "data-resource-id": row.resource.id,
        "data-kind": "resource",
        "data-depth": String(row.depth),
      }),
    );
    const groupRow = p.part("div", (b, row: TimelineGroupRow) =>
      b.attrs({
        role: "group",
        "aria-label": row.resource.title,
        "data-timeline-row": "",
        "data-group-id": row.resource.id,
        "data-kind": "group",
        "data-depth": String(row.depth),
      }),
    );
    const disclosurePart = p.part("button", (b, row: TimelineRow) => {
      const expanded = !collapsedIds.has(row.resource.id);
      return b
        .attrs({
          "aria-label": disclosureLabelOf(row, expanded),
          "aria-description": disclosureDescriptionOf(row),
          type: "button",
          "data-timeline-disclosure": "",
          "data-depth": String(row.depth),
          "aria-expanded": String(expanded),
        })
        .on("click", Message.ClickedDisclosure({ id: row.resource.id }));
    });
    const lane = p.part("div", (b, row: TimelineResourceRow) =>
      withStyle(
        b.attrs({ role: "list", "aria-label": laneLabelOf(row), "data-timeline-lane": "" }),
        { position: "relative", "--timeline-lane-count": String(row.laneCount) },
      ),
    );
    const event = p.part("div", (b, placement: EventPlacement) => {
      const box = placementBoxOf({ span }, laneCounts.get(placement.resourceId) ?? 1, placement);
      const attrs = {
        role: "listitem",
        "data-timeline-event": "",
        "data-event-id": placement.event.id,
        "data-occurrence-id": placement.occurrenceId,
        "data-lane": String(placement.lane),
        "data-starts-before": flag(placement.startsBefore),
        "data-ends-after": flag(placement.endsAfter),
      };
      const style = {
        position: "absolute",
        insetInlineStart: percent(box.inlineStart),
        width: percent(box.inlineSize),
        insetBlockStart: percent(box.blockStart),
        insetBlockEnd: percent(box.blockEnd),
      };
      if (!editor?.canEdit(placement.event)) return withStyle(b.attrs(attrs), style);
      const dragging = gesture?.occurrenceId === placement.occurrenceId;
      return withStyle(
        b.attrs({
          ...attrs,
          tabindex: "0",
          "data-editable": "",
          "data-movable": flag(editor.canMove(placement.event)),
          "data-resizable": flag(editor.canResize(placement.event)),
          "data-dragging": flag(dragging),
        }),
        style,
        // The destination preview stands in for the dragged rendering, which only keeps its place.
        dragging ? { opacity: "0", pointerEvents: "none" } : undefined,
      );
    });
    const resizeHandlePart = p.part("div", (b, edge: ResizeEdge) =>
      withStyle(
        b.attrs({ "aria-hidden": "true", "data-timeline-resize-handle": "", "data-edge": edge }),
        {
          position: "absolute",
          insetBlock: "0",
          ...(edge === "start" ? { insetInlineStart: "0" } : { insetInlineEnd: "0" }),
          touchAction: "none",
        },
      ),
    );
    const previewPart = p.part("div", (b, row: TimelineResourceRow, shown: EditorPreview) => {
      const placement = shown.placement!;
      const box = placementBoxOf({ span }, row.laneCount, placement);
      return withStyle(
        b.attrs({
          role: "listitem",
          "aria-label": shown.description,
          "data-timeline-preview": "",
          "data-status": shown.status,
          "data-not-allowed": flag(shown.status === "rejected"),
          "data-rule": shown.rule,
          "data-event-id": placement.event.id,
          "data-lane": String(placement.lane),
          "data-starts-before": flag(placement.startsBefore),
          "data-ends-after": flag(placement.endsAfter),
        }),
        {
          position: "absolute",
          insetInlineStart: percent(box.inlineStart),
          width: percent(box.inlineSize),
          insetBlockStart: percent(box.blockStart),
          insetBlockEnd: percent(box.blockEnd),
          pointerEvents: "none",
        },
      );
    });
    const statusPart = p.part("div", (b) =>
      b
        .attrs({
          role: "status",
          "aria-live": "polite",
          "aria-atomic": "true",
          "data-timeline-status": "",
        })
        .children(editor?.message ?? ""),
    );
    const windowStatusPart = p.part("div", (b) =>
      b.attrs({
        role: "status",
        "aria-live": loading?.state.status === "failed" ? "assertive" : "polite",
        "aria-atomic": "true",
        "data-timeline-window-status": "",
        "data-status": loading?.state.status,
      }),
    );
    const retryPart = p.part("button", (b) =>
      b.attr("type", "button").on("click", Message.ClickedRetryWindow()),
    );

    const parts = {
      root,
      viewport,
      axis,
      axisSlot,
      resourceRow,
      groupRow,
      lane,
      event,
      /**
       * A pointer target on one edge of an `event`: draw it inside the event, once per edge. It
       * is undefined unless the event can be resized and the edge is the event's actual
       * endpoint, not one the range clips. Give it a width, such as `w-2`. Pressing it resizes at
       * once, with no hold, and the edge follows the pointer, snapped to the grid, until the
       * pointer is released or Escape is pressed. It is hidden from assistive technology.
       */
      resizeHandle: <B extends Parameters<typeof resizeHandlePart>[0]>(
        element: B,
        placement: EventPlacement,
        edge: ResizeEdge,
      ) => {
        const built = resizeHandlePart(element, edge);
        return editor && resizableEdgesOf(placement, editor.canResize(placement.event))[edge]
          ? built
          : undefined;
      },
      /**
       * The result of the edit in progress, in the row it would land in: draw it inside every
       * `lane`. It is undefined except in that row, while the result is in the visible range.
       * Its accessible name describes the result, or says "Not allowed" when a rule rejects it
       * (`data-status="rejected"`); releasing a rejected result proposes nothing.
       */
      preview: <B extends Parameters<typeof previewPart>[0]>(
        element: B,
        row: TimelineResourceRow,
      ) => {
        const shown = editor?.preview;
        if (!shown?.placement || shown.resourceId !== row.resource.id) return undefined;
        return previewPart(element, row, shown);
      },
      /**
       * A polite live region that announces the result while an event is edited and then how the
       * edit ended. Hide it visually if you like, but keep it rendered; its text is the part's.
       */
      editStatus: statusPart,
      /** A native disclosure, or undefined for a row without children. */
      disclosure: <B extends Parameters<typeof disclosurePart>[0]>(
        element: B,
        row: TimelineRow,
      ) => {
        const built = disclosurePart(element, row);
        return row.hasChildren ? built : undefined;
      },
      /** A polite live region for `loading`, assertive while the window has failed. */
      windowStatus: <B extends Parameters<typeof windowStatusPart>[0]>(element: B) => {
        const built = windowStatusPart(element);
        return loading ? built : undefined;
      },
      /** Asks for the window again; it does nothing unless the window has failed. */
      retry: <B extends Parameters<typeof retryPart>[0]>(element: B) => {
        const built = retryPart(element);
        return loading ? built : undefined;
      },
    };
    if (result._tag === "Success" && editing instanceof TimelineInputError)
      return { status: "invalid" as const, error: editing, ...parts };
    return result._tag === "Success"
      ? {
          status: "ready" as const,
          timeline: result.success as Timeline,
          visibleRows,
          collapsedIds: collapsedIds as ReadonlySet<string>,
          loading,
          /** The editor while `editing` is given; undefined while the timeline is read-only. */
          editor: editor as TimelineEditor | undefined,
          ...parts,
        }
      : {
          status: "invalid" as const,
          error: result.failure as TimelineInputError,
          ...parts,
        };
  },
});
