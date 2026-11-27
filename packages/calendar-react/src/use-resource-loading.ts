import {
  nextResourcePageOf,
  observeResourceRequest,
  resourceLoadingLogic,
  resourceRequestsOf,
  resourceScopeOf,
  resourceScopeStateOf,
  retryResourcePageOf,
  shownResourceScopes,
  ResourceObserverError,
  type ResourceCoverageByScope,
  type ResourceObserver,
  type ResourceRequest,
  type ResourceScope,
  type ResourceScopeState,
  type Timeline,
} from "@omnisuite/calendar-core";
import { useSelector, useStore } from "@xstate/store-react";
import { Cause, Effect, Exit, Scope } from "effect";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface ResourceLoadingOptions<TError = unknown> {
  /**
   * What the application knows about each scope, by `scope.key`: the top level (`list`) and the
   * children of each parent. A scope it leaves out is unknown, which is not `loaded-empty`: only
   * the application knows a branch was loaded and held nothing. Report the page you supplied as
   * `loaded`, with `hasMore` and the `cursor` of the next page; report `pending` while a request
   * is in flight and `failed` (with the cursor it failed on) after one fails. Keep the loaded
   * resources in the timeline's `resources`: they stay shown while another page is pending or has
   * failed.
   */
  readonly coverage?: ResourceCoverageByScope<TError>;
  /**
   * Called after the render that needs a page, with the scope, the cursor you reported for it, and
   * `retry` when the viewer asked again after a failure. The top level is asked for when the end of
   * the list comes into view; a parent's children are asked for when the viewer first expands it.
   * Nothing is asked for while the scope is pending, after it failed, or once its last page is
   * loaded. The calendar neither fetches nor caches: start or reuse a query here and return a
   * function that stops observing it. That function runs when a later page is asked for, when the
   * parent collapses, and when the timeline unmounts. A query that other consumers share must
   * outlive it: whether to abort is the application's decision.
   */
  readonly onLoad?: ResourceObserver;
}

/** One list of resources being loaded in pages, and what the application knows about it. */
export interface ResourceScopeLoading<TError = unknown> {
  readonly scope: ResourceScope;
  readonly state: ResourceScopeState<TError>;
  /** Whether a page may follow what is loaded: true for an unknown scope, false once it is terminal. */
  readonly hasMore: boolean;
  /** Asks again for the page that failed. It does nothing unless the scope has `failed`. */
  retry(): void;
  /** Asks for the next page. It does nothing unless the scope is `loaded` with `hasMore`. */
  loadMore(): void;
}

export interface ResourceLoading<TError = unknown> {
  /** The top level of the tree, loaded as the viewer scrolls down. */
  readonly list: ResourceScopeLoading<TError>;
  /** The children of a parent, loaded when it is expanded. Parents are groups or resources. */
  branch(parentId: string): ResourceScopeLoading<TError>;
  /**
   * A ref for the element after the last row: the next page of the top level is asked for while
   * it is in view. Use `ResourceTimeline.ListEnd`, which sets it.
   */
  readonly listEnd: (element: HTMLElement | null) => void;
}

/** Identifies a cursor, which is the application's opaque value, so that equal ones compare equal. */
function cursorKeyOf(cursor: unknown) {
  try {
    return JSON.stringify(cursor ?? null);
  } catch {
    return String(cursor);
  }
}

/** Whether an element is inside its scroll container's visible area, measured now. */
function isInView(element: HTMLElement | null) {
  if (!element) return false;
  const container = element.closest("[data-timeline-viewport]");
  const box = element.getBoundingClientRect();
  const view = container
    ? container.getBoundingClientRect()
    : { top: 0, bottom: element.ownerDocument.documentElement.clientHeight };
  return box.top <= view.bottom && box.bottom >= view.top;
}

interface Observation {
  /** The page and the attempt this observation was opened for. */
  readonly identity: string;
  readonly close: () => void;
}

/** Starts an observation, or throws whatever the application's observer threw. */
function observe(onLoad: ResourceObserver, request: ResourceRequest, retry: boolean) {
  // The scope belongs to this observation: closing it ends only this one.
  const scope = Effect.runSync(Scope.make());
  const exit = Effect.runSyncExit(
    observeResourceRequest(onLoad, request, { retry }).pipe(Scope.provide(scope)),
  );
  if (Exit.isFailure(exit)) {
    Effect.runSync(Scope.close(scope, exit));
    // The application's own error is reported to React as it was thrown.
    const failure = Cause.squash(exit.cause);
    throw failure instanceof ResourceObserverError ? failure.cause : failure;
  }
  return () => Effect.runSync(Scope.close(scope, Exit.void));
}

/**
 * Signals the pages of resources the timeline needs through `onLoad`, after React has committed
 * and not while rendering. A scope is asked for again only when its page changes, so however often
 * the timeline renders or the viewport is observed, the same request is not signalled twice. Each
 * scope has at most one observation, and it ends when the scope stops being shown.
 */
export function useResourceLoading<TError>(
  timeline: Timeline<any, any> | undefined,
  collapsedIds: ReadonlySet<string>,
  options: ResourceLoadingOptions<TError> | undefined,
): ResourceLoading<TError> | undefined {
  const store = useStore(resourceLoadingLogic);
  const requested = useSelector(store, (snapshot) => snapshot.context.requested);
  // Counts the times the end of the list came into or went out of view, to look again.
  const [observations, setObservations] = useState(0);
  const end = useRef<HTMLElement | null>(null);
  // Whether the end was in view when last looked at, so that only a change looks again.
  const wasVisible = useRef(false);
  const coverage = options?.coverage;
  const onLoad = options?.onLoad;
  // What the application reports now, for a `retry` or `loadMore` kept from an earlier render.
  const latestCoverage = useRef<ResourceCoverageByScope<TError>>({});
  useEffect(() => {
    latestCoverage.current = coverage ?? {};
  }, [coverage]);
  const active = useRef(new Map<string, Observation>());
  // The scopes the application reported on at the previous look.
  const reported = useRef(new Set<string>());
  // The explicit requests already signalled, so that a click is signalled once.
  const consumed = useRef<Record<string, number>>({});

  // Unmounting, including a development remount, ends every observation this timeline owns.
  useEffect(() => {
    const observations = active.current;
    return () => {
      for (const { close } of observations.values()) close();
      observations.clear();
    };
  }, []);

  useEffect(() => {
    const observations = active.current;
    if (!timeline || !onLoad) {
      for (const { close } of observations.values()) close();
      observations.clear();
      // A click that cannot be signalled now is dropped, not kept for whenever `onLoad` arrives.
      consumed.current = { ...requested };
      return;
    }
    const known = coverage ?? {};
    const listEndVisible = isInView(end.current);
    wasVisible.current = listEndVisible;
    const shown = shownResourceScopes(timeline.rows, collapsedIds);
    // A collapsed branch stops being observed; whatever it loads goes to the application's cache.
    const shownKeys = new Set(shown.map((scope) => scope.key));
    for (const [key, observation] of observations)
      if (!shownKeys.has(key)) {
        observation.close();
        observations.delete(key);
      }
    // A scope the application stops reporting was cancelled, and is asked for afresh. One it has not
    // reported yet is only waiting for the application, and is not asked for again.
    for (const key of reported.current)
      if (!Object.hasOwn(known, key)) {
        observations.get(key)?.close();
        observations.delete(key);
      }
    reported.current = new Set(Object.keys(known));

    const wanted = new Map<
      string,
      { request: ResourceRequest; retry: boolean; identity: string }
    >();
    for (const request of resourceRequestsOf({
      rows: timeline.rows,
      collapsedIds,
      coverage: known,
      listEndVisible,
    }))
      wanted.set(request.scope.key, {
        request,
        retry: false,
        identity: cursorKeyOf(request.cursor),
      });
    for (const scope of shown) {
      const count = requested[scope.key] ?? 0;
      if (count <= (consumed.current[scope.key] ?? 0)) continue;
      consumed.current[scope.key] = count;
      const state = resourceScopeStateOf(known, scope);
      const request =
        retryResourcePageOf(scope, state) ??
        (state.status === "loaded" ? nextResourcePageOf(scope, state) : undefined);
      // A further page is one request however it was asked for; only a retry asks for a page again.
      if (request)
        wanted.set(scope.key, {
          request,
          retry: state.status === "failed",
          identity:
            state.status === "failed"
              ? `${cursorKeyOf(request.cursor)}|retry|${count}`
              : cursorKeyOf(request.cursor),
        });
    }
    for (const [key, { request, retry, identity }] of wanted) {
      const current = observations.get(key);
      if (current?.identity === identity) continue;
      current?.close();
      observations.delete(key);
      observations.set(key, { identity, close: observe(onLoad, request, retry) });
    }
  }, [timeline, collapsedIds, coverage, onLoad, observations, requested]);

  // Looks again when the end of the list may have come into or gone out of view. A scroll is the
  // usual cause, and the observer covers layout changes with no scroll; neither alone is enough,
  // because the observer reports nothing when the end leaves and returns between two frames.
  const watching = useRef<(() => void) | undefined>(undefined);
  const listEnd = useCallback((element: HTMLElement | null) => {
    watching.current?.();
    watching.current = undefined;
    end.current = element;
    if (!element) return;
    const container = element.closest("[data-timeline-viewport]");
    const scrolled: EventTarget = container ?? window;
    const look = () => {
      const visible = isInView(element);
      if (visible === wasVisible.current) return;
      wasVisible.current = visible;
      setObservations((count) => count + 1);
    };
    const observer = new IntersectionObserver(look, { root: container });
    observer.observe(element);
    scrolled.addEventListener("scroll", look, { passive: true });
    watching.current = () => {
      observer.disconnect();
      scrolled.removeEventListener("scroll", look);
    };
  }, []);
  useEffect(() => () => watching.current?.(), []);

  const enabled = options !== undefined;
  return useMemo(() => {
    if (!enabled) return undefined;
    const known = coverage ?? {};
    const scopeLoading = (parentId: string | null): ResourceScopeLoading<TError> => {
      const scope = resourceScopeOf(parentId);
      const state = resourceScopeStateOf(known, scope);
      return {
        scope,
        state,
        hasMore:
          state.status === "unknown" || (state.status !== "loaded-empty" && state.hasMore === true),
        retry() {
          if (resourceScopeStateOf(latestCoverage.current, scope).status === "failed")
            store.trigger.requested({ key: scope.key });
        },
        loadMore() {
          const latest = resourceScopeStateOf(latestCoverage.current, scope);
          if (latest.status === "loaded" && latest.hasMore === true)
            store.trigger.requested({ key: scope.key });
        },
      };
    };
    return { list: scopeLoading(null), branch: scopeLoading, listEnd };
  }, [enabled, coverage, store, listEnd]);
}
