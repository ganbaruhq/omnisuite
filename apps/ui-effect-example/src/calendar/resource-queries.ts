// A copy of the React example's `resource-queries.ts`: the application's side of resource loading.

import type {
  CalendarNodeInput,
  ResourceCoverageByScope,
  ResourceRequest,
  ScopeCoverage,
} from "@omnisuite/calendar-core";

// Like `window-queries.ts`, this is the application's side of the bargain: the calendar names a
// scope and hands back the cursor it was given, and everything else lives here. A cache keyed by
// scope, one request per scope however many consumers observe it, and the cursor of each scope.
// A response for a branch the viewer has collapsed is not thrown away: it fills the cache, so
// opening the branch again is instant, and it never touches what the calendar shows.

/** One page of a scope. A page without `nextCursor` is the last one. */
export interface ResourcePage {
  readonly resources: readonly CalendarNodeInput[];
  /** Opaque to the calendar; whatever this application needs to ask for the page after. */
  readonly nextCursor?: unknown;
}

/** Loads one page of the top level (`parentId` null) or of one parent's children. */
export type FetchResources = (request: {
  readonly parentId: string | null;
  readonly cursor: unknown;
}) => Promise<ResourcePage>;

export interface ResourceQueriesSnapshot {
  /** What is known about each scope, for the calendar's `resourceLoading.coverage`. */
  readonly coverage: ResourceCoverageByScope;
  /** Every resource loaded so far, from every scope, so none disappears while another loads. */
  readonly resources: readonly CalendarNodeInput[];
}

export interface ResourceQueries {
  /**
   * Starts, or joins, the request for a page and returns a function that stops observing it. Pass
   * it to the calendar as `resourceLoading.onLoad`. A failed page is requested again only on `retry`.
   */
  observe(request: ResourceRequest, context: { readonly retry: boolean }): () => void;
  subscribe(listener: () => void): () => void;
  getSnapshot(): ResourceQueriesSnapshot;
}

interface Entry {
  /** The outcome of the latest finished request, which a pending one is shown over. */
  settled: ScopeCoverage | undefined;
  resources: CalendarNodeInput[];
  inFlight: { readonly cursorKey: string } | undefined;
}

const cursorKeyOf = (cursor: unknown) => JSON.stringify(cursor ?? null);

export function createResourceQueries(fetchResources: FetchResources): ResourceQueries {
  const entries = new Map<string, Entry>();
  const listeners = new Set<() => void>();
  let snapshot: ResourceQueriesSnapshot = { coverage: {}, resources: [] };

  const publish = () => {
    const coverage: Record<string, ScopeCoverage> = {};
    const byId = new Map<string, CalendarNodeInput>();
    for (const [key, entry] of entries) {
      const { settled } = entry;
      if (entry.inFlight)
        // The page before keeps its cursor and `hasMore`, so the end of the list is still known.
        coverage[key] = {
          status: "pending",
          ...(settled &&
            "hasMore" in settled && { hasMore: settled.hasMore, cursor: settled.cursor }),
        };
      else if (settled) coverage[key] = settled;
      for (const resource of entry.resources) byId.set(resource.id, resource);
    }
    snapshot = { coverage, resources: [...byId.values()] };
    for (const listener of listeners) listener();
  };

  const start = (entry: Entry, parentId: string | null, cursor: unknown) => {
    const inFlight = { cursorKey: cursorKeyOf(cursor) };
    entry.inFlight = inFlight;
    fetchResources({ parentId, cursor }).then(
      (page) => {
        entry.inFlight = undefined;
        entry.resources = [...entry.resources, ...page.resources];
        const hasMore = page.nextCursor !== undefined;
        entry.settled =
          entry.resources.length === 0
            ? { status: "loaded-empty" }
            : { status: "loaded", hasMore, ...(hasMore && { cursor: page.nextCursor }) };
        publish();
      },
      (error: unknown) => {
        entry.inFlight = undefined;
        entry.settled = { status: "failed", error, hasMore: true, cursor };
        publish();
      },
    );
    publish();
  };

  return {
    observe({ scope, cursor }) {
      let entry = entries.get(scope.key);
      if (!entry) {
        entry = { settled: undefined, resources: [], inFlight: undefined };
        entries.set(scope.key, entry);
      }
      // The page this scope is waiting for: the first, or the one its last outcome names. A request
      // for any other page is a second timeline asking for what the first already loaded.
      const expected =
        entry.settled && "cursor" in entry.settled ? entry.settled.cursor : undefined;
      if (!entry.inFlight && cursorKeyOf(cursor) === cursorKeyOf(expected))
        start(entry, scope.parentId, cursor);
      // The request keeps running with no observer left: a collapsed branch fills the cache.
      return () => {};
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
  };
}

/**
 * A stand-in for a server: the nodes whose `parentId` is the one asked for, in pages of
 * `pageSize`, after `delayMs`. The cursor is a string the calendar cannot read. A scope listed in
 * `failFirst` fails on its first request, so that retrying can be tried.
 */
export function createSampleResourceFetch(
  nodes: readonly CalendarNodeInput[],
  {
    pageSize = 5,
    delayMs = 300,
    failFirst = [],
  }: { pageSize?: number; delayMs?: number; failFirst?: readonly (string | null)[] } = {},
): FetchResources {
  const failed = new Set<string | null>();
  return ({ parentId, cursor }) =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        if (failFirst.includes(parentId) && !failed.has(parentId)) {
          failed.add(parentId);
          reject(new Error("The server could not be reached."));
          return;
        }
        const scoped = nodes.filter((node) => (node.parentId ?? null) === parentId);
        const start = typeof cursor === "string" ? Number(atob(cursor).replace("offset:", "")) : 0;
        const end = start + pageSize;
        resolve({
          resources: scoped.slice(start, end),
          nextCursor: end < scoped.length ? btoa(`offset:${end}`) : undefined,
        });
      }, delayMs);
    });
}
