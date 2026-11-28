import { Subscription, UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import {
  collapsedIdsOf,
  decodeTimelineResult,
  disclosureDescriptionOf,
  disclosureLabelOf,
  expansionToggleOf,
  laneLabelOf,
  placementBoxOf,
  resourceHierarchyLogic,
  slotBoxOf,
  visibleTimelineRows,
  windowAttemptOf,
  windowLoadingLogic,
  windowStateOf,
  type CalendarEventInput,
  type CalendarNodeInput,
  type EventPlacement,
  type Timeline,
  type TimelineGroupRow,
  type TimelineInputError,
  type TimelineResourceRow,
  type TimelineRow,
  type TimelineSlot,
  type TimelineWindow,
  type WindowState,
} from "@omnisuite/calendar-core";
import { Schema } from "effect";
import { flag, withStyle } from "./host.js";
import { loadWindow, windowOf, type WindowLoadingOptions } from "./window-loading.js";

const declared = <T>(is: (u: unknown) => boolean) => Schema.declare((u): u is T => is(u));
const isArray = (u: unknown) => Array.isArray(u);
const isObject = (u: unknown) => typeof u === "object" && u !== null;

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
});
export type ResourceTimelineProps = typeof ResourceTimelineProps.Type;

// The snapshots of calendar-core's stores, as data: the viewer's expansion, the retries asked
// for each window, and the attempt last signalled for each window.
const Model = Schema.Struct({
  collapsedIds: Schema.Array(Schema.String),
  expandedIds: Schema.Array(Schema.String),
  retries: Schema.Record(Schema.String, Schema.Number),
  signalled: Schema.Record(Schema.String, Schema.Number),
});
type Model = typeof Model.Type;

const Message = UiSchema.TaggedEnum({
  ClickedDisclosure: { id: Schema.String },
  ClickedRetryWindow: {},
  SignalledWindow: { key: Schema.String, attempt: Schema.Number },
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
  init: () => ({ collapsedIds: [], expandedIds: [], retries: {}, signalled: {} }),
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
  },
  subscriptions: ({ model, props }) => {
    const window = windowOf(decode(props), props.loading);
    const onLoadWindow = props.loading?.onLoadWindow;
    if (!window || !onLoadWindow) return [];
    const attempt = windowAttemptOf(model.retries, window.key);
    return [
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
    const visibleRows = timeline ? visibleTimelineRows(timeline.rows, collapsedIds) : [];
    const laneCounts = new Map<string, number>();
    for (const row of visibleRows)
      if (row.kind === "resource") laneCounts.set(row.resource.id, row.laneCount);
    const window = windowOf(result, p.props.loading);
    const loading: ResourceTimelineLoading | undefined = window && {
      window,
      state: windowStateOf(p.props.loading?.coverage ?? {}, window),
    };
    const span = timeline?.span ?? 1;

    const root = p.part("div", (b) =>
      withStyle(b.attr("data-timeline-root", ""), { "--timeline-span": String(span) }),
    );
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
      return withStyle(
        b.attrs({
          role: "listitem",
          "data-timeline-event": "",
          "data-event-id": placement.event.id,
          "data-occurrence-id": placement.occurrenceId,
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
        },
      );
    });
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
    return result._tag === "Success"
      ? {
          status: "ready" as const,
          timeline: result.success as Timeline,
          visibleRows,
          collapsedIds: collapsedIds as ReadonlySet<string>,
          loading,
          ...parts,
        }
      : { status: "invalid" as const, error: result.failure as TimelineInputError, ...parts };
  },
});
