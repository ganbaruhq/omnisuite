import { Component, Mount, Subscription, UiSchema } from "@effect/ui";
import { Html, HtmlCommand } from "@effect/ui/html";
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
  EditorEvents,
  editorFields,
  editorViewOf,
  idleEditor,
  quiet,
  reconcileGesture,
  type EditorContext,
  type EditorEvent,
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
import {
  applyKeyboardAction,
  blurActionOf,
  KeyboardAction,
  keyboardActionOf,
  keyShortcutsOf,
  reevaluateKeyboard,
  type KeyboardStep,
} from "./keyboard.js";
import {
  idleResourceLoading,
  requestResources,
  resourceLoadingOf,
  ResourceLoadingState,
  resourceSubscriptions,
  reviewResources,
  WatchListEnd,
  type ResourceLoading,
  type ResourceLoadingOptions,
  type ResourceScopeLoading,
} from "./resource-loading.js";
import { loadWindow, windowOf, type WindowLoadingOptions } from "./window-loading.js";
import { declared, isArray, isObject, isFunction } from "./schema.js";

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
   * Turns resource loading on: the children of a parent with `lazyChildren` are asked for from
   * `onLoad` when it is first expanded, and the top level when `listEnd` comes into view.
   */
  resourceLoading: Schema.optional(declared<ResourceLoadingOptions>(isObject)),
  /**
   * Turns editing on: events move by dragging them and resize by their `resizeHandle`s, and a
   * focused event moves with Enter or Space and the arrows and resizes with Alt or Shift and the
   * arrows. Without it the timeline is read-only. Invalid options make the timeline `invalid`.
   */
  editing: Schema.optional(declared<EditingInput<any>>(isObject)),
  /** Words for the preview's accessible description. Defaults to English. */
  describe: Schema.optional(declared<(preview: PreviewDescription<any>) => string>(isFunction)),
});
export type ResourceTimelineProps = typeof ResourceTimelineProps.Type;

// The snapshots of calendar-core's stores, as data: the viewer's expansion, the retries asked
// for each window, the attempt last signalled for each window, the edit gesture with where the
// pointer is while it follows one, and resource loading. After a keyboard edit is proposed,
// `focusAfter` is the rendering to focus once the events change.
const Model = Schema.Struct({
  collapsedIds: Schema.Array(Schema.String),
  expandedIds: Schema.Array(Schema.String),
  retries: Schema.Record(Schema.String, Schema.Number),
  signalled: Schema.Record(Schema.String, Schema.Number),
  ...editorFields,
  pointer: Schema.NullOr(PointerPosition),
  focusAfter: Schema.NullOr(Schema.Struct({ occurrenceId: Schema.String, layout: Schema.Number })),
  resources: ResourceLoadingState,
});
type Model = typeof Model.Type;

const Message = UiSchema.TaggedEnum({
  ClickedDisclosure: { id: Schema.String },
  ClickedRetryWindow: {},
  SignalledWindow: { key: Schema.String, attempt: Schema.Number },
  Keyboard: { action: KeyboardAction },
  /** The events may have changed since a keyboard edit was proposed. */
  FocusDue: {},
  /** What resource loading reads may have changed. */
  ReviewedResources: {},
  /** The viewer asked for a scope again: its failed page, or its next page. */
  RequestedResources: { parentId: Schema.NullOr(Schema.String) },
  SawListEnd: { visible: Schema.Boolean },
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
 * The events a {@link ResourceTimeline} emits, to map with `onEmit`: `Proposed` when a changed,
 * allowed destination is released or confirmed, and `RuleFailed` when an editing rule throws.
 */
export const ResourceTimelineEvents = EditorEvents;

/**
 * Applies an editor step: the next Model, with the pointer forgotten once no gesture follows
 * it, and the step's events emitted to the application.
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
  const next = $.set(state) as Next & { emit(...events: readonly EditorEvent[]): Next };
  return next.emit(...step.notices);
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

/** Each rendering of an event, so that focus can follow an event moved by the keyboard. */
const EventRef = Html.ref("TimelineEvent", "div");

/** A keyboard step, waiting to focus the rendering it moved the event to once that is supplied. */
const appliedKeyboard = <Next>(
  $: {
    readonly model: Model;
    readonly props: ResourceTimelineProps;
    set(model: Model): Next;
  },
  step: KeyboardStep<Model>,
) =>
  applied($, {
    notices: step.notices,
    state: step.focus
      ? {
          ...step.state,
          focusAfter: { occurrenceId: step.focus, layout: layoutIdOf(decode($.props)) },
        }
      : step.state.gesture && step.state.focusAfter
        ? { ...step.state, focusAfter: null }
        : step.state,
  });

/** What resource loading works against now. */
const resourceContextOf = (props: ResourceTimelineProps, model: Model) => {
  const result = decode(props);
  const rows = result._tag === "Success" ? result.success.rows : undefined;
  return {
    rows,
    collapsedIds: rows ? collapsedIdsOf(rows, expansionOf(model)) : new Set<string>(),
    options: props.resourceLoading,
  };
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
 *
 * With `editing`, the timeline emits {@link ResourceTimelineEvents}: map `Proposed` and
 * `RuleFailed` with `onEmit` and decide on each proposal in the application's own update.
 */
export const ResourceTimeline = Html.component({
  name: "ResourceTimeline",
  props: ResourceTimelineProps,
  model: Model,
  message: Message,
  events: EditorEvents,
}).make({
  init: () => ({
    collapsedIds: [],
    expandedIds: [],
    retries: {},
    signalled: {},
    ...idleEditor,
    pointer: null,
    focusAfter: null,
    resources: idleResourceLoading,
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
    Keyboard: ($, { action }) => {
      const context = editorContextOf($.props, $.model);
      return context ? appliedKeyboard($, applyKeyboardAction($.model, context, action)) : $.model;
    },
    Reconciled: ($) => {
      const context = editorContextOf($.props, $.model);
      const { state, current } = reconcileGesture($.model, context);
      // Each input's gesture is evaluated again by its own rules.
      return applied(
        $,
        !current || !context
          ? quiet(state)
          : state.gesture?.input === "keyboard"
            ? reevaluateKeyboard(state, context)
            : reevaluatePointer(state, context),
      );
    },
    FocusDue: ($) => {
      const wanted = $.model.focusAfter;
      const result = decode($.props);
      // Until the application supplies new events, the moved rendering is not there yet.
      if (!wanted || layoutIdOf(result) === wanted.layout) return $.model;
      const next = $.set({ ...$.model, focusAfter: null });
      const shown =
        result._tag === "Success" &&
        visibleTimelineRows(
          result.success.rows,
          collapsedIdsOf(result.success.rows, expansionOf($.model)),
        ).some(
          (row) =>
            row.kind === "resource" &&
            row.placements.some(({ occurrenceId }) => occurrenceId === wanted.occurrenceId),
        );
      return shown
        ? next.run(HtmlCommand.focus(EventRef.at(wanted.occurrenceId), () => Component.noop))
        : next;
    },
    ReviewedResources: ($) => {
      const next = reviewResources($.model.resources, resourceContextOf($.props, $.model));
      return next === $.model.resources ? $.model : $.evolve({ resources: () => next });
    },
    RequestedResources: ($, { parentId }) => {
      const next = requestResources($.model.resources, $.props.resourceLoading?.coverage, parentId);
      return next === $.model.resources ? $.model : $.evolve({ resources: () => next });
    },
    SawListEnd: ($, { visible }) =>
      $.model.resources.listEndVisible === visible
        ? $.model
        : $.evolve({ resources: (resources) => ({ ...resources, listEndVisible: visible }) }),
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
    // Once the events change after a keyboard edit, focus follows the event to its new rendering.
    const focusing = model.focusAfter
      ? [
          Subscription.make(
            "focus",
            [model.focusAfter.occurrenceId, layoutIdOf(decode(props))],
            () => Stream.concat(Stream.make(Message.FocusDue()), Stream.never),
          ),
        ]
      : [];
    const resources = resourceSubscriptions(
      model.resources,
      { ...resourceContextOf(props, model), layout: layoutIdOf(decode(props)) },
      () => Message.ReviewedResources(),
    );
    const window = windowOf(decode(props), props.loading);
    const onLoadWindow = props.loading?.onLoadWindow;
    if (!window || !onLoadWindow) return [...reconciling, ...focusing, ...resources];
    const attempt = windowAttemptOf(model.retries, window.key);
    return [
      ...reconciling,
      ...focusing,
      ...resources,
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
      const target = { placement, editor };
      const keyboard = (action: KeyboardAction | undefined) =>
        action && Message.Keyboard({ action });
      return withStyle(
        b
          .attrs({
            ...attrs,
            tabindex: "0",
            "aria-keyshortcuts": keyShortcutsOf(target) || undefined,
            "data-editable": "",
            "data-movable": flag(editor.canMove(placement.event)),
            "data-resizable": flag(editor.canResize(placement.event)),
            "data-dragging": flag(dragging),
          })
          .ref(EventRef.at(placement.occurrenceId))
          .on("keydown", (key) => keyboard(keyboardActionOf(key, target)), {
            preventDefault: true,
          })
          .on("blur", () => keyboard(blurActionOf(target))),
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
    const resourceLoading = resourceLoadingOf(p.props.resourceLoading);
    const listEndPart = p.part("div", (b) => {
      const list = resourceLoading?.list;
      const marked = b.attrs({
        "data-timeline-list-end": "",
        "data-status": list?.state.status,
        "data-has-more": flag(list?.hasMore === true),
      });
      return resourceLoading
        ? marked.onMount(
            WatchListEnd().pipe(Mount.map((visible) => Message.SawListEnd({ visible }))),
          )
        : marked;
    });
    const scopeStatusPart = p.part("div", (b, loading: ResourceScopeLoading) =>
      b.attrs({
        role: "status",
        "aria-live": loading.state.status === "failed" ? "assertive" : "polite",
        "aria-atomic": "true",
        "data-timeline-scope-status": "",
        "data-parent-id": loading.scope.parentId ?? undefined,
        "data-status": loading.state.status,
        "data-has-more": flag(loading.hasMore),
      }),
    );
    const requestPart = p.part("button", (b, loading: ResourceScopeLoading) =>
      b
        .attr("type", "button")
        .on("click", Message.RequestedResources({ parentId: loading.scope.parentId })),
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
       * (`data-status="rejected"`); releasing or confirming a rejected result proposes nothing.
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
      /**
       * The element after the last row: the next page of the top level is asked for while it is in
       * view. It carries the top level's `data-status` and `data-has-more` with resource loading.
       */
      listEnd: listEndPart,
      /**
       * A live region for one scope, assertive while it has failed; undefined without resource
       * loading. Draw it under an expanded parent, with `resourceLoading.branch(id)`.
       */
      scopeStatus: <B extends Parameters<typeof scopeStatusPart>[0]>(
        element: B,
        loading: ResourceScopeLoading,
      ) => {
        const built = scopeStatusPart(element, loading);
        return resourceLoading ? built : undefined;
      },
      /** Asks again for a scope's failed page; it does nothing unless the scope has failed. */
      retryResources: <B extends Parameters<typeof requestPart>[0]>(
        element: B,
        loading: ResourceScopeLoading,
      ) => {
        const built = requestPart(element, loading);
        return resourceLoading ? built : undefined;
      },
      /** Asks for a scope's next page; it does nothing unless it is loaded with more. */
      loadMoreResources: <B extends Parameters<typeof requestPart>[0]>(
        element: B,
        loading: ResourceScopeLoading,
      ) => {
        const built = requestPart(element, loading);
        return resourceLoading ? built : undefined;
      },
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
          /** The scopes of resources and what is known of them, with `resourceLoading`. */
          resourceLoading: resourceLoading as ResourceLoading | undefined,
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
