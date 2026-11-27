import { Effect, Exit, Result, Scope } from "effect";
import { describe, expect, it } from "vite-plus/test";
import {
  collapsedIdsOf,
  decodeTimelineResult,
  nextResourcePageOf,
  observeResourceRequest,
  resourceHierarchyLogic,
  resourceLoadingLogic,
  resourceRequestsOf,
  resourceScopeOf,
  resourceScopeStateOf,
  retryResourcePageOf,
  shownResourceScopes,
  ResourceObserverError,
  visibleTimelineRows,
  type CalendarNodeInput,
  type ResourceCoverageByScope,
  type ResourceRequest,
  type ScopeCoverage,
  type Timeline,
} from "./index.js";

const timelineOf = (
  resources: readonly CalendarNodeInput[],
  events: readonly {
    id: string;
    title: string;
    resourceIds: string[];
    start: string;
    end: string;
  }[] = [],
): Timeline => {
  const result = decodeTimelineResult({
    range: { start: "2026-10-26T00:00Z", end: "2026-10-27T00:00Z" },
    slotDuration: "PT1H",
    resources,
    events,
  });
  if (Result.isFailure(result)) throw new Error(result.failure.message);
  return result.success;
};

const initialContext = () => resourceHierarchyLogic.createStore().getSnapshot().context;

const tree: readonly CalendarNodeInput[] = [
  { id: "hostel", title: "Hostel", kind: "group", lazyChildren: true },
  { id: "annex", title: "Annex", kind: "group", lazyChildren: true },
  { id: "room-1", title: "Room 1", parentId: "hostel", lazyChildren: true },
  { id: "room-2", title: "Room 2", parentId: "hostel" },
  { id: "bed-1", title: "Bed 1", parentId: "room-1" },
];

describe("resource scopes", () => {
  it("names the root list and each parent as separate scopes", () => {
    const keys = [null, "hostel", "annex", "null"].map((id) => resourceScopeOf(id).key);

    expect(new Set(keys).size).toBe(4);
    expect(resourceScopeOf(null)).toEqual({ key: resourceScopeOf(null).key, parentId: null });
    expect(resourceScopeOf("hostel").key).toBe(resourceScopeOf("hostel").key);
  });

  it("treats a scope the application has not reported as unknown, not as empty", () => {
    const coverage: ResourceCoverageByScope = {
      [resourceScopeOf("hostel").key]: { status: "loaded" },
    };

    expect(resourceScopeStateOf(coverage, resourceScopeOf("annex"))).toEqual({ status: "unknown" });
    expect(resourceScopeStateOf(coverage, resourceScopeOf("hostel"))).toEqual({ status: "loaded" });
    // Coverage reported for one parent says nothing about another.
    expect(resourceScopeStateOf(coverage, resourceScopeOf(null))).toEqual({ status: "unknown" });
  });
});

describe("which page a scope asks for", () => {
  const scope = resourceScopeOf(null);
  const next = (state: ScopeCoverage | { status: "unknown" }) => nextResourcePageOf(scope, state);

  it("asks for the first page of a scope it knows nothing about, without a cursor", () => {
    expect(next({ status: "unknown" })).toEqual({ scope, cursor: undefined });
  });

  it("asks for the page after a loaded one, giving back the application's cursor untouched", () => {
    const cursor = { after: "room-40", opaque: [1, 2] };

    const request = next({ status: "loaded", hasMore: true, cursor });

    expect(request?.cursor).toBe(cursor);
  });

  it.each([
    ["a terminal page", { status: "loaded", hasMore: false, cursor: "end" }],
    ["a page without hasMore", { status: "loaded", cursor: "end" }],
    ["a loaded-empty scope", { status: "loaded-empty", hasMore: true }],
    ["a pending page", { status: "pending", hasMore: true, cursor: "c" }],
    ["a failed page", { status: "failed", hasMore: true, cursor: "c" }],
  ] as const)("does not ask again after %s", (_name, state) => {
    expect(next(state)).toBeUndefined();
  });

  it("retries only a failed page, with the cursor it failed on", () => {
    expect(retryResourcePageOf(scope, { status: "failed", cursor: "c2" })).toEqual({
      scope,
      cursor: "c2",
    });
    for (const state of [
      { status: "unknown" },
      { status: "pending" },
      { status: "loaded", hasMore: true, cursor: "c" },
      { status: "loaded-empty" },
    ] as const)
      expect(retryResourcePageOf(scope, state)).toBeUndefined();
  });
});

describe("lazy children", () => {
  it("is expandable before any child is loaded, and starts collapsed", () => {
    const timeline = timelineOf([tree[0]!, tree[1]!]);

    expect(timeline.rows.map((row) => [row.resource.id, row.hasChildren])).toEqual([
      ["hostel", true],
      ["annex", true],
    ]);
    const collapsed = collapsedIdsOf(timeline.rows, initialContext());
    expect([...collapsed].sort()).toEqual(["annex", "hostel"]);
  });

  it("starts a resource with children to load collapsed, like a group", () => {
    const timeline = timelineOf(tree);

    const collapsed = collapsedIdsOf(timeline.rows, initialContext());

    expect([...collapsed].sort()).toEqual(["annex", "hostel", "room-1"]);
  });

  it("opens only the branch the viewer expands", () => {
    const timeline = timelineOf(tree);
    const store = resourceHierarchyLogic.createStore();
    store.trigger.setExpanded({ id: "hostel", expanded: true });

    const collapsed = collapsedIdsOf(timeline.rows, store.getSnapshot().context);

    expect(visibleTimelineRows(timeline.rows, collapsed).map((row) => row.resource.id)).toEqual([
      "hostel",
      "room-1",
      "room-2",
      "annex",
    ]);
  });

  it("keeps a branch collapsed that the viewer collapsed when its children load afterwards", () => {
    const store = resourceHierarchyLogic.createStore();
    store.trigger.setExpanded({ id: "hostel", expanded: true });
    store.trigger.setExpanded({ id: "hostel", expanded: false });

    // The late response arrives: the children are now part of the input.
    const loaded = timelineOf(tree);
    const collapsed = collapsedIdsOf(loaded.rows, store.getSnapshot().context);

    expect(collapsed.has("hostel")).toBe(true);
    expect(visibleTimelineRows(loaded.rows, collapsed).map((row) => row.resource.id)).toEqual([
      "hostel",
      "annex",
    ]);
  });

  it("keeps the expansion of descendants when an ancestor collapses", () => {
    const timeline = timelineOf(tree);
    const store = resourceHierarchyLogic.createStore();
    store.trigger.setExpanded({ id: "hostel", expanded: true });
    store.trigger.setExpanded({ id: "room-1", expanded: true });
    store.trigger.setExpanded({ id: "hostel", expanded: false });
    store.trigger.setExpanded({ id: "hostel", expanded: true });

    const collapsed = collapsedIdsOf(timeline.rows, store.getSnapshot().context);

    expect(visibleTimelineRows(timeline.rows, collapsed).map((row) => row.resource.id)).toEqual([
      "hostel",
      "room-1",
      "bed-1",
      "room-2",
      "annex",
    ]);
  });
});

describe("the requests a timeline makes", () => {
  const rootKey = resourceScopeOf(null).key;
  const hostelKey = resourceScopeOf("hostel").key;
  const annexKey = resourceScopeOf("annex").key;
  const room1Key = resourceScopeOf("room-1").key;

  const requests = (
    coverage: ResourceCoverageByScope,
    collapsed: readonly string[],
    listEndVisible = false,
    nodes = tree,
  ) =>
    resourceRequestsOf({
      rows: timelineOf(nodes).rows,
      collapsedIds: new Set(collapsed),
      coverage,
      listEndVisible,
    }).map(({ scope, cursor }) => [scope.key, cursor]);

  it("asks for the page after the last when the end of the list is in view", () => {
    const coverage = { [rootKey]: { status: "loaded", hasMore: true, cursor: "p2" } } as const;

    expect(requests(coverage, ["hostel", "annex", "room-1"], true)).toEqual([[rootKey, "p2"]]);
  });

  it("does not ask for another page until the end of the list is in view", () => {
    const coverage = { [rootKey]: { status: "loaded", hasMore: true, cursor: "p2" } } as const;

    expect(requests(coverage, ["hostel", "annex", "room-1"], false)).toEqual([]);
  });

  it("stops asking at a terminal page, and while a page is pending or has failed", () => {
    for (const state of [
      { status: "loaded", hasMore: false },
      { status: "pending", hasMore: true, cursor: "p2" },
      { status: "failed", hasMore: true, cursor: "p2" },
    ] as const)
      expect(requests({ [rootKey]: state }, ["hostel", "annex", "room-1"], true)).toEqual([]);
  });

  it("asks for the children of each expanded branch whose children are unknown, under that parent", () => {
    expect(requests({ [rootKey]: { status: "loaded" } }, ["room-1"])).toEqual([
      [hostelKey, undefined],
      [annexKey, undefined],
    ]);
  });

  it("asks for the children of a resource parent too", () => {
    expect(
      requests({ [rootKey]: { status: "loaded" }, [hostelKey]: { status: "loaded" } }, []),
    ).toEqual([
      [room1Key, undefined],
      [annexKey, undefined],
    ]);
  });

  it("does not ask for a collapsed branch, or for anything below one", () => {
    expect(requests({ [rootKey]: { status: "loaded" } }, ["hostel", "annex", "room-1"])).toEqual(
      [],
    );
    // room-1 is expanded but sits inside the collapsed hostel.
    expect(requests({ [rootKey]: { status: "loaded" } }, ["hostel", "annex"])).toEqual([]);
  });

  it("tells a loaded-empty branch from an unloaded one: it asks for neither again", () => {
    const coverage = {
      [rootKey]: { status: "loaded" },
      [hostelKey]: { status: "loaded-empty" },
      [annexKey]: { status: "pending" },
    } as const;

    expect(requests(coverage, ["room-1"])).toEqual([]);
  });

  it("never asks for a further page of a branch by itself", () => {
    const coverage = {
      [rootKey]: { status: "loaded" },
      [hostelKey]: { status: "loaded", hasMore: true, cursor: "c2" },
      [annexKey]: { status: "loaded" },
    } as const;

    expect(requests(coverage, ["room-1"], true)).toEqual([]);
  });

  it("keeps the scopes of independent parents independent", () => {
    const coverage = {
      [rootKey]: { status: "loaded" },
      [hostelKey]: { status: "pending" },
    } as const;

    // Annex is still asked for while Hostel is in flight.
    expect(requests(coverage, ["room-1"])).toEqual([[annexKey, undefined]]);
  });

  it("shows the root list and every expanded branch that has children to load", () => {
    const timeline = timelineOf(tree);

    expect(
      shownResourceScopes(timeline.rows, new Set(["room-1"])).map((scope) => scope.key),
    ).toEqual([rootKey, hostelKey, annexKey]);
    expect(
      shownResourceScopes(timeline.rows, new Set(["hostel", "annex", "room-1"])).map(
        (scope) => scope.key,
      ),
    ).toEqual([rootKey]);
  });
});

describe("explicit requests", () => {
  it("counts a retry or a load-more request per scope", () => {
    const store = resourceLoadingLogic.createStore();
    const hostel = resourceScopeOf("hostel").key;

    store.trigger.requested({ key: hostel });
    store.trigger.requested({ key: hostel });
    store.trigger.requested({ key: resourceScopeOf(null).key });

    expect(store.getSnapshot().context.requested).toEqual({
      [hostel]: 2,
      [resourceScopeOf(null).key]: 1,
    });
  });
});

describe("observeResourceRequest", () => {
  const request: ResourceRequest = { scope: resourceScopeOf("hostel"), cursor: "c1" };

  it("does nothing until run, then signals the request and ends the observation with its scope", () => {
    const events: string[] = [];
    const program = Effect.gen(function* () {
      const scope = yield* Scope.make();
      yield* observeResourceRequest(
        (seen, context) => {
          events.push(`observe ${seen.scope.parentId} ${String(seen.cursor)} ${context.retry}`);
          return () => events.push("release");
        },
        request,
        { retry: true },
      ).pipe(Scope.provide(scope));
      events.push("observing");
      yield* Scope.close(scope, Exit.void);
    });
    expect(events).toEqual([]);

    Effect.runSync(program);

    expect(events).toEqual(["observe hostel c1 true", "observing", "release"]);
  });

  it("fails with a typed error that keeps the cause when the observer throws", () => {
    const cause = new Error("no client");

    const error = Effect.runSync(
      Effect.flip(
        Effect.scoped(
          observeResourceRequest(
            () => {
              throw cause;
            },
            request,
            { retry: false },
          ),
        ),
      ),
    );

    expect(error).toBeInstanceOf(ResourceObserverError);
    expect(error.cause).toBe(cause);
  });
});
