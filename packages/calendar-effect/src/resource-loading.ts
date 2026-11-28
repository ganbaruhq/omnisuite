import { Mount, Subscription } from "@effect/ui";
import {
  nextResourcePageOf,
  observeResourceRequest,
  resourceLoadingLogic,
  resourceRequestsOf,
  resourceScopeOf,
  resourceScopeStateOf,
  retryResourcePageOf,
  shownResourceScopes,
  type ResourceCoverageByScope,
  type ResourceObserver,
  type ResourceRequest,
  type ResourceScope,
  type ResourceScopeState,
  type TimelineRow,
} from "@omnisuite/calendar-core";
import { Effect, Queue, Schema, Stream } from "effect";
import { declared, isObject } from "./schema.js";

// Resource loading, as calendar-react's `useResourceLoading` does it: the top level of the tree is
// asked for when the end of the list comes into view, and the children of a parent with
// `lazyChildren` when the viewer first expands it. Each scope has at most one observation, opened
// for one page; it ends when a later page is asked for, when the scope stops being shown, or when
// the application stops reporting it. Here the observations are data in the Model, and each one is
// a Subscription, so ending one is removing it.

/** The same options as calendar-react's `resourceLoading`. */
export interface ResourceLoadingOptions<TError = unknown> {
  /**
   * What the application knows about each scope, by `scope.key`: the top level and the children
   * of each parent. A scope it leaves out is unknown, which is not `loaded-empty`. Keep the loaded
   * resources in the timeline's `resources`.
   */
  readonly coverage?: ResourceCoverageByScope<TError> | undefined;
  /**
   * Called once for each page the timeline needs, and again for a failed page after a retry. The
   * calendar neither fetches nor caches: start or reuse a query here and return a function that
   * stops observing it. That function runs when a later page is asked for, when the parent
   * collapses, and when the timeline goes away.
   *
   * An observer rather than an event: the observation is scoped to what the timeline shows,
   * and its end, which the timeline decides, is not a message the application could answer.
   */
  readonly onLoad?: ResourceObserver | undefined;
}

/** One list of resources being loaded in pages, and what the application knows about it. */
export interface ResourceScopeLoading<TError = unknown> {
  readonly scope: ResourceScope;
  readonly state: ResourceScopeState<TError>;
  /** Whether a page may follow what is loaded: true for an unknown scope, false once it is terminal. */
  readonly hasMore: boolean;
}

export interface ResourceLoading<TError = unknown> {
  /** The top level of the tree, loaded as the viewer scrolls down. */
  readonly list: ResourceScopeLoading<TError>;
  /** The children of a parent, loaded when it is expanded. */
  branch(parentId: string): ResourceScopeLoading<TError>;
}

const Observation = Schema.Struct({
  /** The page and the attempt this observation is for: a different one replaces it. */
  identity: Schema.String,
  /** Numbers the observations, so that replacing one restarts its Subscription. */
  id: Schema.Number,
  request: declared<ResourceRequest>(isObject),
  retry: Schema.Boolean,
});

export const ResourceLoadingState = Schema.Struct({
  /** The snapshot of `resourceLoadingLogic`: how often each scope was asked for again. */
  requested: Schema.Record(Schema.String, Schema.Number),
  /** The explicit requests already signalled, so that a click is signalled once. */
  consumed: Schema.Record(Schema.String, Schema.Number),
  observed: Schema.Record(Schema.String, Observation),
  /** The scopes the application reported on at the previous review. */
  reported: Schema.Array(Schema.String),
  listEndVisible: Schema.Boolean,
  opened: Schema.Number,
});
export type ResourceLoadingState = typeof ResourceLoadingState.Type;

export const idleResourceLoading: ResourceLoadingState = {
  requested: {},
  consumed: {},
  observed: {},
  reported: [],
  listEndVisible: false,
  opened: 0,
};

/** What a review works against: the timeline's rows while it is valid. */
export interface ResourceLoadingContext {
  readonly rows: readonly TimelineRow[] | undefined;
  readonly collapsedIds: ReadonlySet<string>;
  readonly options: ResourceLoadingOptions | undefined;
}

/** Identifies a cursor, which is the application's opaque value, so that equal ones compare equal. */
function cursorKeyOf(cursor: unknown) {
  try {
    return JSON.stringify(cursor ?? null);
  } catch {
    return String(cursor);
  }
}

const loadingStore = resourceLoadingLogic.createStore();

/**
 * Asks for a scope again: the failed page, or the next page of a loaded scope with more. It does
 * nothing in any other state.
 */
export function requestResources(
  state: ResourceLoadingState,
  coverage: ResourceCoverageByScope | undefined,
  parentId: string | null,
): ResourceLoadingState {
  const scope = resourceScopeOf(parentId);
  const known = resourceScopeStateOf(coverage ?? {}, scope);
  const allowed =
    known.status === "failed" || (known.status === "loaded" && known.hasMore === true);
  if (!allowed) return state;
  const [next] = loadingStore.transition(
    { ...loadingStore.getSnapshot(), context: { requested: state.requested } },
    { type: "requested", key: scope.key },
  );
  return { ...state, requested: next.context.requested };
}

/**
 * The observations the timeline needs now, as calendar-react's effect works them out after a
 * render: the pages it asks for by itself, and the explicit requests not yet signalled.
 */
export function reviewResources(
  state: ResourceLoadingState,
  { rows, collapsedIds, options }: ResourceLoadingContext,
): ResourceLoadingState {
  if (!rows || !options?.onLoad) {
    // A click that cannot be signalled now is dropped, not kept for whenever `onLoad` arrives.
    if (Object.keys(state.observed).length === 0 && state.consumed === state.requested)
      return state;
    return { ...state, observed: {}, consumed: state.requested };
  }
  const known = options.coverage ?? {};
  const shown = shownResourceScopes(rows, collapsedIds);
  const shownKeys = new Set(shown.map((scope) => scope.key));
  const observed: Record<string, typeof Observation.Type> = {};
  for (const [key, observation] of Object.entries(state.observed))
    // A collapsed branch stops being observed, and so does a scope the application stops
    // reporting: it was cancelled, and is asked for afresh. One it has not reported yet is only
    // waiting for the application.
    if (shownKeys.has(key) && !(state.reported.includes(key) && !Object.hasOwn(known, key)))
      observed[key] = observation;
  const reported = Object.keys(known);

  const wanted = new Map<string, { request: ResourceRequest; retry: boolean; identity: string }>();
  for (const request of resourceRequestsOf({
    rows,
    collapsedIds,
    coverage: known,
    listEndVisible: state.listEndVisible,
  }))
    wanted.set(request.scope.key, {
      request,
      retry: false,
      identity: cursorKeyOf(request.cursor),
    });
  const consumed = { ...state.consumed };
  for (const scope of shown) {
    const count = state.requested[scope.key] ?? 0;
    if (count <= (consumed[scope.key] ?? 0)) continue;
    consumed[scope.key] = count;
    const scopeState = resourceScopeStateOf(known, scope);
    const request =
      retryResourcePageOf(scope, scopeState) ??
      (scopeState.status === "loaded" ? nextResourcePageOf(scope, scopeState) : undefined);
    // A further page is one request however it was asked for; only a retry asks for a page again.
    if (request)
      wanted.set(scope.key, {
        request,
        retry: scopeState.status === "failed",
        identity:
          scopeState.status === "failed"
            ? `${cursorKeyOf(request.cursor)}|retry|${count}`
            : cursorKeyOf(request.cursor),
      });
  }
  let opened = state.opened;
  for (const [key, { request, retry, identity }] of wanted) {
    if (observed[key]?.identity === identity) continue;
    observed[key] = { identity, id: ++opened, request, retry };
  }
  return { ...state, observed, consumed, reported, opened };
}

// Numbers the application's objects, so that a Subscription can tell a new one from the same one.
const identities = new WeakMap<object, number>();
let lastIdentity = 0;
const identityOf = (value: object | undefined) => {
  if (value === undefined) return 0;
  const known = identities.get(value);
  if (known !== undefined) return known;
  identities.set(value, ++lastIdentity);
  return lastIdentity;
};

const once = <Msg>(message: Msg) => Stream.concat(Stream.make(message), Stream.never);

/**
 * A review whenever what it reads changes, and an observation for each page being observed. An
 * error the observer throws is a defect, so it fails the component as it was thrown.
 */
export const resourceSubscriptions = <Msg>(
  state: ResourceLoadingState,
  context: ResourceLoadingContext & { readonly layout: number },
  reviewed: () => Msg,
) => {
  const options = context.options;
  if (!options) return [];
  const onLoad = options.onLoad;
  return [
    Subscription.make(
      "resource-review",
      [
        context.layout,
        identityOf(options.coverage),
        identityOf(onLoad),
        JSON.stringify([...context.collapsedIds].sort()),
        JSON.stringify(state.requested),
        state.listEndVisible,
      ],
      () => once(reviewed()),
    ),
    ...(onLoad
      ? Object.entries(state.observed).map(([key, { id, request, retry }]) =>
          Subscription.make("resource-page", [key, id], () =>
            Stream.unwrap(
              observeResourceRequest(onLoad, request, { retry }).pipe(
                Effect.catchTag("ResourceObserverError", (error) => Effect.die(error.cause)),
                Effect.as(Stream.never as Stream.Stream<Msg>),
              ),
            ),
          ),
        )
      : []),
  ];
};

/** What the timeline exposes about resource loading while it is on. */
export const resourceLoadingOf = (
  options: ResourceLoadingOptions | undefined,
): ResourceLoading | undefined => {
  if (!options) return undefined;
  const known = options.coverage ?? {};
  const scopeLoading = (parentId: string | null): ResourceScopeLoading => {
    const scope = resourceScopeOf(parentId);
    const state = resourceScopeStateOf(known, scope);
    return {
      scope,
      state,
      hasMore:
        state.status === "unknown" || (state.status !== "loaded-empty" && state.hasMore === true),
    };
  };
  return { list: scopeLoading(null), branch: scopeLoading };
};

/** Whether an element is inside its scroll container's visible area, measured now. */
function isInView(element: HTMLElement) {
  const container = element.closest("[data-timeline-viewport]");
  const box = element.getBoundingClientRect();
  const view = container
    ? container.getBoundingClientRect()
    : { top: 0, bottom: element.ownerDocument.documentElement.clientHeight };
  return box.top <= view.bottom && box.bottom >= view.top;
}

const isElement = (node: unknown): node is HTMLElement =>
  typeof HTMLElement !== "undefined" && node instanceof HTMLElement;

/**
 * Follows whether the end of the list is in view: on mount, and whenever it may have come into or
 * gone out of view. A scroll is the usual cause, and the observer covers layout changes with no
 * scroll; neither alone is enough, because the observer reports nothing when the end leaves and
 * returns between two frames.
 */
export const WatchListEnd = Mount.makeStream("WatchListEnd", {}, (node: unknown) => {
  if (!isElement(node) || typeof IntersectionObserver === "undefined")
    return Stream.never as Stream.Stream<boolean>;
  return Stream.callback<boolean>((queue) =>
    Effect.acquireRelease(
      Effect.sync(() => {
        const container = node.closest("[data-timeline-viewport]");
        const scrolled: EventTarget = container ?? node.ownerDocument.defaultView ?? node;
        let wasVisible: boolean | undefined;
        const look = () => {
          const visible = isInView(node);
          if (visible === wasVisible) return;
          wasVisible = visible;
          Queue.offerUnsafe(queue, visible);
        };
        const observer = new IntersectionObserver(look, { root: container });
        observer.observe(node);
        scrolled.addEventListener("scroll", look, { passive: true });
        look();
        return () => {
          observer.disconnect();
          scrolled.removeEventListener("scroll", look);
        };
      }),
      (stop) => Effect.sync(stop),
    ),
  );
});
