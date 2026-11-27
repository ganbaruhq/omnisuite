import { createStoreLogic } from "@xstate/store";
import { Data, Effect, type Scope } from "effect";
import { visibleTimelineRows, type TimelineRow } from "./timeline.js";

/**
 * One list of resources the application loads in pages: the top level of the tree (`parentId`
 * null), or the children of one parent, which may be a group or a resource. Each scope has its own
 * cursor, pending state and failure, so one parent loading or failing never touches another.
 */
export interface ResourceScope {
  /** Key `coverage` by it, so that a response is only ever read for the scope it was loaded for. */
  readonly key: string;
  readonly parentId: string | null;
}

/** The scope of the top level for `null`, or of the children of that parent. */
export function resourceScopeOf(parentId: string | null): ResourceScope {
  return { key: JSON.stringify(parentId), parentId };
}

/**
 * What the application knows about one scope after its latest request. The calendar never reads
 * a cursor, only hands it back:
 *
 * - `cursor` is the opaque value that requests the next page. After a `failed` request it is the
 *   one that failed, so that a retry asks for the same page.
 * - `hasMore` says that a page follows those loaded. A loaded page without it is terminal.
 * - `loaded-empty` is a scope loaded with no resources in it, which is not the same as one that has
 *   not been loaded (`unknown`, because nothing was reported).
 */
export type ScopeCoverage<TError = unknown> =
  | {
      readonly status: "pending" | "loaded";
      readonly hasMore?: boolean;
      readonly cursor?: unknown;
    }
  | { readonly status: "loaded-empty" }
  | {
      readonly status: "failed";
      readonly error?: TError;
      readonly hasMore?: boolean;
      readonly cursor?: unknown;
    };

/** Coverage by {@link ResourceScope.key}. A cancelled request is not a failure: leave it out. */
export type ResourceCoverageByScope<TError = unknown> = Readonly<
  Record<string, ScopeCoverage<TError>>
>;

export type ResourceScopeState<TError = unknown> =
  | { readonly status: "unknown" }
  | ScopeCoverage<TError>;

/** What is known about a scope. Coverage reported for any other scope has no effect on it. */
export function resourceScopeStateOf<TError>(
  coverage: ResourceCoverageByScope<TError>,
  scope: Pick<ResourceScope, "key">,
): ResourceScopeState<TError> {
  return Object.hasOwn(coverage, scope.key) ? coverage[scope.key]! : { status: "unknown" };
}

/** A page of a scope to ask the application for. */
export interface ResourceRequest {
  readonly scope: ResourceScope;
  /** Exactly what the application reported for this scope, or undefined for the first page. */
  readonly cursor: unknown;
}

/**
 * The request for the first page of a scope nothing is known about, or for the page after a
 * loaded one. There is none while a request is pending or after one failed, nor once the last
 * page is loaded or the scope is known to be empty.
 */
export function nextResourcePageOf(
  scope: ResourceScope,
  state: ResourceScopeState,
): ResourceRequest | undefined {
  if (state.status === "unknown") return { scope, cursor: undefined };
  if (state.status === "loaded" && state.hasMore === true) return { scope, cursor: state.cursor };
  return undefined;
}

/** The request that asks again for the page that failed; there is none for any other state. */
export function retryResourcePageOf(
  scope: ResourceScope,
  state: ResourceScopeState,
): ResourceRequest | undefined {
  return state.status === "failed" ? { scope, cursor: state.cursor } : undefined;
}

/**
 * The scopes the timeline shows, whose requests stay observed: the top level, and the children of
 * every expanded parent whose `lazyChildren` are to load, as long as the parent itself is visible.
 * Collapsing a branch, or one of its ancestors, takes its scope out.
 */
export function shownResourceScopes(
  rows: readonly TimelineRow[],
  collapsedIds: ReadonlySet<string>,
): readonly ResourceScope[] {
  return [
    resourceScopeOf(null),
    ...visibleTimelineRows(rows, collapsedIds)
      .filter((row) => row.resource.lazyChildren && !collapsedIds.has(row.resource.id))
      .map((row) => resourceScopeOf(row.resource.id)),
  ];
}

/**
 * The requests the timeline makes by itself: the next page of the top level when the viewer has
 * scrolled to the end of the list, and the first page of the children of each expanded parent
 * whose children are not known. Later pages of a branch are asked for explicitly. A request is
 * made only for a scope that is not pending, failed or finished, so repeated observations of the
 * same viewport ask for nothing new.
 */
export function resourceRequestsOf({
  rows,
  collapsedIds,
  coverage,
  listEndVisible,
}: {
  readonly rows: readonly TimelineRow[];
  readonly collapsedIds: ReadonlySet<string>;
  readonly coverage: ResourceCoverageByScope;
  readonly listEndVisible: boolean;
}): readonly ResourceRequest[] {
  return shownResourceScopes(rows, collapsedIds).flatMap((scope) => {
    const state = resourceScopeStateOf(coverage, scope);
    const isList = scope.parentId === null;
    if (isList ? !listEndVisible : state.status !== "unknown") return [];
    const request = nextResourcePageOf(scope, state);
    return request ? [request] : [];
  });
}

/**
 * The transient state of one calendar's resource loading: how often each scope was explicitly
 * asked for again, to retry a failed page or to load a further page of a branch. Coverage is not
 * here; the application owns it and supplies it.
 */
export const resourceLoadingLogic = createStoreLogic({
  context: (): { readonly requested: Readonly<Record<string, number>> } => ({ requested: {} }),
  on: {
    requested: (context, event: { readonly key: string }) => ({
      requested: { ...context.requested, [event.key]: (context.requested[event.key] ?? 0) + 1 },
    }),
  },
});

/**
 * Called when the calendar needs a page of resources. `retry` is true when the viewer asked again
 * after a failure. It may return a function that ends the calendar's interest, called when the
 * scope is no longer shown, a later page is asked for, or the calendar goes away. That must stop
 * observing, not abort a request that another consumer shares: whether a query is cancelled is the
 * application's decision.
 */
export type ResourceObserver = (
  request: ResourceRequest,
  context: { readonly retry: boolean },
) => void | (() => void);

/** The application's {@link ResourceObserver} threw. */
export class ResourceObserverError extends Data.TaggedError("ResourceObserverError")<{
  readonly cause: unknown;
}> {}

/**
 * Signals a request to the observer and, when the scope closes, ends the observation. Nothing
 * runs until the Effect does.
 */
export const observeResourceRequest = (
  observer: ResourceObserver,
  request: ResourceRequest,
  context: { readonly retry: boolean },
): Effect.Effect<void, ResourceObserverError, Scope.Scope> =>
  Effect.acquireRelease(
    Effect.try({
      try: () => observer(request, context),
      catch: (cause) => new ResourceObserverError({ cause }),
    }),
    (release) => Effect.sync(() => (typeof release === "function" ? release() : undefined)),
  ).pipe(Effect.asVoid);
