import type {
  CalendarNodeInput,
  ResourceCoverageByScope,
  ResourceObserver,
  ResourceRequest,
} from "@omnisuite/calendar-core";
import { ResourceTimeline, useResourceTimeline } from "@omnisuite/calendar-react";
import { act, StrictMode, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { page } from "vite-plus/test/browser";
import { ResourceTimelineExample } from "./resource-timeline-example";
import { flatTimeline } from "./sample-timeline";
import { createResourceQueries, type FetchResources, type ResourcePage } from "./resource-queries";
import "./styles.css";

const roots: { root: Root; container: HTMLElement }[] = [];

async function render(node: ReactNode) {
  const container = document.body.appendChild(document.createElement("div"));
  const root = createRoot(container);
  roots.push({ root, container });
  await act(async () => root.render(node));
  return { root, container };
}

afterEach(async () => {
  for (const { root, container } of roots.splice(0)) {
    await act(async () => root.unmount());
    container.remove();
  }
});

/** A fetch that answers only when the test says so, in the order the test chooses. */
function controlledFetch() {
  const calls: {
    parentId: string | null;
    cursor: unknown;
    resolve(page: ResourcePage): Promise<void>;
    reject(error: unknown): Promise<void>;
  }[] = [];
  const fetchResources: FetchResources = ({ parentId, cursor }) =>
    new Promise((resolve, reject) => {
      calls.push({
        parentId,
        cursor,
        resolve: (result) => act(async () => resolve(result)),
        reject: (error) => act(async () => reject(error)),
      });
    });
  return { calls, queries: createResourceQueries(fetchResources) };
}

/** `count` rooms, each tall enough that a few pages overflow the viewport. */
const rooms = (prefix: string, count: number, parentId?: string): CalendarNodeInput[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index + 1}`,
    title: `${prefix} ${index + 1}`,
    ...(parentId && { parentId }),
  }));

const hostel: CalendarNodeInput = {
  id: "hostel",
  title: "Hostel",
  kind: "group",
  lazyChildren: true,
};
const annex: CalendarNodeInput = { id: "annex", title: "Annex", kind: "group", lazyChildren: true };

const viewport = () => document.querySelector<HTMLElement>("[data-timeline-viewport]")!;
const rowIds = () =>
  [...document.querySelectorAll<HTMLElement>("[data-timeline-row]")].map(
    (row) => row.dataset.resourceId ?? row.dataset.groupId,
  );
const scopeStatus = (parentId?: string) =>
  document.querySelector<HTMLElement>(
    parentId === undefined
      ? "[data-timeline-scope-status]:not([data-parent-id])"
      : `[data-timeline-scope-status][data-parent-id="${parentId}"]`,
  );
const click = (name: string | RegExp) =>
  act(async () => {
    (
      page.getByRole("button", { name, exact: typeof name === "string" }).element() as HTMLElement
    ).click();
  });
const scrollToEnd = () =>
  act(async () => {
    viewport().scrollTop = viewport().scrollHeight;
    await new Promise((resolve) => setTimeout(resolve, 150));
  });
const settle = () =>
  act(async () => void (await new Promise((resolve) => setTimeout(resolve, 150))));

const events = flatTimeline.events;

describe("paging the resource list as the viewer scrolls", () => {
  it("asks for another page only when the end of the list is reached, and gives the cursor back untouched", async () => {
    const { calls, queries } = controlledFetch();
    await render(
      <ResourceTimelineExample input={{ resources: [], events }} resourceQueries={queries} />,
    );
    await vi.waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0]).toMatchObject({ parentId: null, cursor: undefined });
    expect(scopeStatus()?.dataset.status).toBe("pending");

    await calls[0]!.resolve({ resources: rooms("room", 15), nextCursor: { after: "room-15" } });

    expect(rowIds()).toHaveLength(15);
    await settle();
    // The end of the list is below the fold: nothing asks yet.
    expect(calls).toHaveLength(1);

    await scrollToEnd();

    await vi.waitFor(() => expect(calls).toHaveLength(2));
    expect(calls[1]).toMatchObject({ parentId: null, cursor: { after: "room-15" } });
  });

  it("does not ask again while the page is pending, however often the viewport is observed", async () => {
    const { calls, queries } = controlledFetch();
    await render(
      <ResourceTimelineExample input={{ resources: [], events }} resourceQueries={queries} />,
    );
    await vi.waitFor(() => expect(calls).toHaveLength(1));
    await calls[0]!.resolve({ resources: rooms("room", 15), nextCursor: "p2" });
    await scrollToEnd();
    await vi.waitFor(() => expect(calls).toHaveLength(2));

    await scrollToEnd();
    await act(async () => {
      viewport().scrollTop = 0;
    });
    await scrollToEnd();

    expect(calls).toHaveLength(2);
    expect(scopeStatus()?.dataset.status).toBe("pending");
  });

  it("stops asking once a terminal page is loaded", async () => {
    const { calls, queries } = controlledFetch();
    await render(
      <ResourceTimelineExample input={{ resources: [], events }} resourceQueries={queries} />,
    );
    await vi.waitFor(() => expect(calls).toHaveLength(1));
    await calls[0]!.resolve({ resources: rooms("room", 15), nextCursor: "p2" });
    await scrollToEnd();
    await vi.waitFor(() => expect(calls).toHaveLength(2));

    await calls[1]!.resolve({ resources: rooms("late", 3) });
    await scrollToEnd();
    await scrollToEnd();

    expect(calls).toHaveLength(2);
    expect(rowIds()).toHaveLength(18);
    expect(scopeStatus()?.dataset.hasMore).toBeUndefined();
  });

  it("keeps the rows and the scroll position while a page arrives", async () => {
    const { calls, queries } = controlledFetch();
    await render(
      <ResourceTimelineExample input={{ resources: [], events }} resourceQueries={queries} />,
    );
    await vi.waitFor(() => expect(calls).toHaveLength(1));
    await calls[0]!.resolve({ resources: rooms("room", 15), nextCursor: "p2" });
    await scrollToEnd();
    await vi.waitFor(() => expect(calls).toHaveLength(2));
    const before = viewport().scrollTop;
    const element = viewport();

    await calls[1]!.resolve({ resources: rooms("more", 15), nextCursor: "p3" });

    expect(viewport()).toBe(element);
    expect(viewport().scrollTop).toBe(before);
    expect(rowIds()).toHaveLength(30);
  });

  it("shows a failure beside the list, keeps what is loaded, and retries the same page only when asked", async () => {
    const { calls, queries } = controlledFetch();
    await render(
      <ResourceTimelineExample input={{ resources: [], events }} resourceQueries={queries} />,
    );
    await vi.waitFor(() => expect(calls).toHaveLength(1));
    await calls[0]!.resolve({ resources: rooms("room", 15), nextCursor: "p2" });
    await scrollToEnd();
    await vi.waitFor(() => expect(calls).toHaveLength(2));

    await calls[1]!.reject(new Error("offline"));
    await scrollToEnd();
    await scrollToEnd();

    expect(scopeStatus()?.dataset.status).toBe("failed");
    await expect.element(page.getByText(/Could not load more rooms/)).toBeVisible();
    expect(rowIds()).toHaveLength(15);
    // Nothing asks again by itself.
    expect(calls).toHaveLength(2);

    await click("Retry");

    expect(calls).toHaveLength(3);
    expect(calls[2]).toMatchObject({ parentId: null, cursor: "p2" });
    await calls[2]!.resolve({ resources: rooms("more", 2) });
    expect(rowIds()).toHaveLength(17);
  });

  it("shows events for a resource once it loads, without losing its other assignments", async () => {
    const { calls, queries } = controlledFetch();
    await render(
      <ResourceTimelineExample
        input={{ resources: [], events: flatTimeline.events }}
        resourceQueries={queries}
        initialPreset="day"
      />,
    );
    await vi.waitFor(() => expect(calls).toHaveLength(1));
    // The fire drill names Rooms 201, 202 and 301; Room 201 comes first.
    await calls[0]!.resolve({
      resources: [{ id: "room-201", title: "Room 201" }],
      nextCursor: "p2",
    });
    expect(document.querySelectorAll('[data-event-id="fire-drill"]')).toHaveLength(1);

    await scrollToEnd();
    await vi.waitFor(() => expect(calls).toHaveLength(2));
    await calls[1]!.resolve({ resources: [{ id: "room-202", title: "Room 202" }] });

    expect(document.querySelectorAll('[data-event-id="fire-drill"]')).toHaveLength(2);
  });
});

describe("loading the children of an expanded parent", () => {
  const root = (nodes: readonly CalendarNodeInput[] = [hostel, annex]) => ({
    resources: nodes,
    events,
  });

  async function loaded(nodes?: readonly CalendarNodeInput[]) {
    const fetch = controlledFetch();
    await render(<ResourceTimelineExample input={root(nodes)} resourceQueries={fetch.queries} />);
    await vi.waitFor(() => expect(fetch.calls).toHaveLength(1));
    // The top level was supplied by the application; this settles its coverage.
    await fetch.calls[0]!.resolve({ resources: [...(nodes ?? [hostel, annex])] });
    return fetch;
  }

  it("shows an unloaded group as collapsed and asks for nothing until it is expanded", async () => {
    const { calls } = await loaded();

    await settle();

    expect(calls).toHaveLength(1);
    await expect.element(page.getByRole("button", { name: "Expand Hostel" })).toBeVisible();
    expect(document.querySelector('[aria-expanded="true"]')).toBeNull();
  });

  it("asks for the children under the expanded parent and shows them below it", async () => {
    const { calls } = await loaded();

    await click("Expand Hostel");

    expect(calls).toHaveLength(2);
    expect(calls[1]).toMatchObject({ parentId: "hostel", cursor: undefined });
    expect(scopeStatus("hostel")?.dataset.status).toBe("pending");
    await expect.element(page.getByRole("button", { name: "Collapse Hostel" })).toBeVisible();

    await calls[1]!.resolve({ resources: rooms("room", 2, "hostel") });

    expect(rowIds()).toEqual(["hostel", "room-1", "room-2", "annex"]);
  });

  it("loads independent parents concurrently, whichever answers first", async () => {
    const { calls } = await loaded();

    await click("Expand Hostel");
    await click("Expand Annex");
    expect(calls.slice(1).map((call) => call.parentId)).toEqual(["hostel", "annex"]);
    expect(scopeStatus("hostel")?.dataset.status).toBe("pending");
    expect(scopeStatus("annex")?.dataset.status).toBe("pending");

    await calls[2]!.resolve({ resources: rooms("annex-room", 1, "annex") });
    expect(scopeStatus("hostel")?.dataset.status).toBe("pending");
    await calls[1]!.resolve({ resources: rooms("hostel-room", 2, "hostel") });

    // Each answer is under its own parent.
    expect(rowIds()).toEqual(["hostel", "hostel-room-1", "hostel-room-2", "annex", "annex-room-1"]);
  });

  it("confines a failure to its own branch and retries only that branch", async () => {
    const { calls } = await loaded();
    await click("Expand Hostel");
    await click("Expand Annex");

    await calls[1]!.reject(new Error("offline"));
    await calls[2]!.resolve({ resources: rooms("annex-room", 1, "annex") });

    expect(scopeStatus("hostel")?.dataset.status).toBe("failed");
    expect(scopeStatus("annex")?.dataset.status).toBe("loaded");
    expect(rowIds()).toEqual(["hostel", "annex", "annex-room-1"]);
    await settle();
    expect(calls).toHaveLength(3);

    await click("Retry loading Hostel");

    expect(calls).toHaveLength(4);
    expect(calls[3]).toMatchObject({ parentId: "hostel", cursor: undefined });
    await calls[3]!.resolve({ resources: rooms("hostel-room", 1, "hostel") });
    expect(rowIds()).toEqual(["hostel", "hostel-room-1", "annex", "annex-room-1"]);
  });

  it("asks for the children of a resource parent as it does for a group", async () => {
    const { calls } = await loaded([{ id: "room-1", title: "Room 1", lazyChildren: true }]);

    await click("Expand Room 1");

    expect(calls[1]).toMatchObject({ parentId: "room-1" });
    await calls[1]!.resolve({ resources: [{ id: "bed-1", title: "Bed 1", parentId: "room-1" }] });
    expect(rowIds()).toEqual(["room-1", "bed-1"]);
  });

  it("tells a branch that loaded empty from one that was never loaded", async () => {
    const { calls } = await loaded();
    await click("Expand Hostel");

    await calls[1]!.resolve({ resources: [] });

    expect(scopeStatus("hostel")?.dataset.status).toBe("loaded-empty");
    await expect.element(page.getByText("Nothing to show under Hostel.")).toBeVisible();
    // Collapsing and expanding it again does not ask again; Annex has not been loaded and still can be.
    await click("Collapse Hostel");
    await click("Expand Hostel");
    expect(calls).toHaveLength(2);
    expect(scopeStatus("annex")).toBeNull();
    await click("Expand Annex");
    expect(calls).toHaveLength(3);
  });

  it("does not reopen a branch collapsed before its response, nor show the response elsewhere", async () => {
    const { calls, queries } = await loaded();
    await click("Expand Hostel");
    await click("Expand Annex");

    await click("Collapse Hostel");
    await calls[1]!.resolve({ resources: rooms("hostel-room", 2, "hostel") });

    // The response went to the application's cache.
    expect(queries.getSnapshot().resources.map(({ id }) => id)).toContain("hostel-room-1");
    expect(rowIds()).toEqual(["hostel", "annex"]);
    await expect.element(page.getByRole("button", { name: "Expand Hostel" })).toBeVisible();
    expect(scopeStatus("hostel")).toBeNull();

    await calls[2]!.resolve({ resources: rooms("annex-room", 1, "annex") });
    expect(rowIds()).toEqual(["hostel", "annex", "annex-room-1"]);

    // Expanding again shows what the cache already has, without another request.
    await click("Expand Hostel");
    expect(calls).toHaveLength(3);
    expect(rowIds()).toEqual(["hostel", "hostel-room-1", "hostel-room-2", "annex", "annex-room-1"]);
  });

  it("keeps the expansion of loaded descendants when an ancestor collapses and reopens", async () => {
    const { calls } = await loaded([hostel]);
    await click("Expand Hostel");
    await calls[1]!.resolve({
      resources: [
        {
          id: "floor-1",
          title: "First floor",
          kind: "group",
          parentId: "hostel",
          lazyChildren: true,
        },
      ],
    });
    await click("Expand First floor");
    await calls[2]!.resolve({ resources: rooms("room", 1, "floor-1") });

    await click("Collapse Hostel");
    await click("Expand Hostel");

    expect(rowIds()).toEqual(["hostel", "floor-1", "room-1"]);
    expect(calls).toHaveLength(3);
  });

  it("asks for a further page of a branch only when the viewer asks", async () => {
    const { calls } = await loaded();
    await click("Expand Hostel");
    await calls[1]!.resolve({ resources: rooms("room", 2, "hostel"), nextCursor: "c2" });
    await settle();
    expect(calls).toHaveLength(2);

    await click("Load more under Hostel");

    expect(calls[2]).toMatchObject({ parentId: "hostel", cursor: "c2" });
    await calls[2]!.resolve({ resources: rooms("more", 1, "hostel") });
    expect(rowIds()).toEqual(["hostel", "room-1", "room-2", "more-1", "annex"]);
    expect(document.body.textContent).not.toContain("Load more under Hostel");
  });
});

describe("sharing and cleanup", () => {
  it("does not ask twice for a scope however often the timeline renders", async () => {
    const { calls, queries } = controlledFetch();
    const { root } = await render(
      <ResourceTimelineExample input={{ resources: [], events }} resourceQueries={queries} />,
    );
    await vi.waitFor(() => expect(calls).toHaveLength(1));

    for (let renders = 0; renders < 3; renders += 1)
      await act(async () =>
        root.render(
          <ResourceTimelineExample input={{ resources: [], events }} resourceQueries={queries} />,
        ),
      );
    await settle();

    expect(calls).toHaveLength(1);
  });

  it("shares one request between timelines that ask for the same scope", async () => {
    const { calls, queries } = controlledFetch();
    await render(
      <ResourceTimelineExample input={{ resources: [], events }} resourceQueries={queries} />,
    );
    await render(
      <ResourceTimelineExample input={{ resources: [], events }} resourceQueries={queries} />,
    );
    await vi.waitFor(() => expect(calls).toHaveLength(1));
    await settle();

    expect(calls).toHaveLength(1);
  });

  it("asks once in StrictMode", async () => {
    const { calls, queries } = controlledFetch();

    await render(
      <StrictMode>
        <ResourceTimelineExample input={{ resources: [], events }} resourceQueries={queries} />
      </StrictMode>,
    );
    await vi.waitFor(() => expect(calls.length).toBeGreaterThan(0));
    await settle();

    expect(calls).toHaveLength(1);
  });

  it("signals after React has committed, ends the observation when a branch collapses, and on unmount", async () => {
    const log: string[] = [];
    function Harness() {
      const state = useResourceTimeline({
        range: { start: "2026-10-26T00:00Z", end: "2026-11-02T00:00Z" },
        slotDuration: "P1D",
        resources: [hostel],
        events: [],
        resourceLoading: {
          coverage: { [JSON.stringify(null)]: { status: "loaded" } },
          onLoad: ({ scope }: ResourceRequest, { retry }) => {
            log.push(
              `observe ${scope.parentId} retry=${retry} rendered=${document.querySelector("[data-timeline-root]") !== null}`,
            );
            return () => void log.push(`release ${scope.parentId}`);
          },
        },
      });
      if (state.status !== "ready") return null;
      return (
        <ResourceTimeline.Root timeline={state.timeline}>
          <ResourceTimeline.Viewport>
            {state.visibleRows.map((row) => (
              <ResourceTimeline.Disclosure
                key={row.resource.id}
                row={row}
                expanded={!state.collapsedIds.has(row.resource.id)}
                onExpandedChange={() => state.toggleExpanded(row.resource.id)}
              />
            ))}
          </ResourceTimeline.Viewport>
        </ResourceTimeline.Root>
      );
    }
    const { root } = await render(<Harness />);
    expect(log).toEqual([]);

    await click("Expand Hostel");
    expect(log).toEqual(["observe hostel retry=false rendered=true"]);

    await click("Collapse Hostel");
    expect(log).toEqual(["observe hostel retry=false rendered=true", "release hostel"]);

    await click("Expand Hostel");
    await act(async () => root.unmount());
    expect(log.slice(2)).toEqual(["observe hostel retry=false rendered=true", "release hostel"]);
  });
});

describe("signalling requests to the application", () => {
  const range = { start: "2026-10-26T00:00Z", end: "2026-11-02T00:00Z" };
  const listKey = JSON.stringify(null);
  const hostelKey = JSON.stringify("hostel");

  function Harness({
    coverage,
    onLoad,
  }: {
    coverage: ResourceCoverageByScope;
    onLoad: ResourceObserver | undefined;
  }) {
    const state = useResourceTimeline({
      range,
      slotDuration: "P1D",
      resources: [hostel],
      events: [],
      resourceLoading: { coverage, onLoad },
    });
    if (state.status !== "ready") return null;
    const { resourceLoading } = state;
    return (
      <ResourceTimeline.Root timeline={state.timeline}>
        <ResourceTimeline.Viewport>
          {state.visibleRows.map((row) => (
            <ResourceTimeline.Disclosure
              key={row.resource.id}
              row={row}
              expanded={!state.collapsedIds.has(row.resource.id)}
              onExpandedChange={() => state.toggleExpanded(row.resource.id)}
            />
          ))}
          <ResourceTimeline.ListEnd loading={resourceLoading} className="h-px" />
        </ResourceTimeline.Viewport>
        <button onClick={() => resourceLoading?.list.loadMore()}>Load more rooms</button>
        <button onClick={() => resourceLoading?.branch("hostel").loadMore()}>
          Load more under Hostel
        </button>
      </ResourceTimeline.Root>
    );
  }

  const logged = () => {
    const log: ResourceRequest[] = [];
    const released: string[] = [];
    const onLoad: ResourceObserver = (request) => {
      log.push(request);
      return () => void released.push(request.scope.key);
    };
    return { log, released, onLoad };
  };

  it("asks again for a scope the application stopped reporting, but not for one it has yet to report", async () => {
    const { log, released, onLoad } = logged();
    const top = { [listKey]: { status: "loaded" } } as const;
    const { root } = await render(<Harness coverage={top} onLoad={onLoad} />);
    await click("Expand Hostel");
    expect(log).toHaveLength(1);

    // The application is slow to report the request it started: nothing is asked for again.
    await act(async () => root.render(<Harness coverage={{ ...top }} onLoad={onLoad} />));
    expect(log).toHaveLength(1);

    await act(async () =>
      root.render(
        <Harness coverage={{ ...top, [hostelKey]: { status: "pending" } }} onLoad={onLoad} />,
      ),
    );
    expect(log).toHaveLength(1);

    // The request was cancelled and left out of the coverage: it is asked for afresh.
    await act(async () => root.render(<Harness coverage={{ ...top }} onLoad={onLoad} />));
    expect(log).toHaveLength(2);
    expect(log[1]).toMatchObject({ scope: { parentId: "hostel" } });
    expect(released).toEqual([hostelKey]);
  });

  it("signals a page once when the viewer asks for it as the end of the list asks too", async () => {
    const { log, onLoad } = logged();
    await render(
      <Harness
        coverage={{ [listKey]: { status: "loaded", hasMore: true, cursor: "p2" } }}
        onLoad={onLoad}
      />,
    );
    await vi.waitFor(() => expect(log).toHaveLength(1));

    await click("Load more rooms");
    await settle();

    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ cursor: "p2" });
  });

  it("drops a click that cannot be signalled, instead of replaying it when `onLoad` arrives", async () => {
    const { log, onLoad } = logged();
    const coverage = {
      [listKey]: { status: "loaded" },
      [hostelKey]: { status: "loaded", hasMore: true, cursor: "c2" },
    } as const;
    const { root } = await render(<Harness coverage={coverage} onLoad={undefined} />);
    await click("Expand Hostel");
    await click("Load more under Hostel");

    await act(async () => root.render(<Harness coverage={coverage} onLoad={onLoad} />));
    await settle();

    expect(log).toEqual([]);
  });

  it("reads the coverage at the time of the click, not at the render that produced the callback", async () => {
    const { log, onLoad } = logged();
    let loadMore: (() => void) | undefined;
    function Capture({ coverage }: { coverage: ResourceCoverageByScope }) {
      const state = useResourceTimeline({
        range,
        slotDuration: "P1D",
        resources: [hostel],
        events: [],
        resourceLoading: { coverage, onLoad },
      });
      if (state.status === "ready") loadMore ??= state.resourceLoading?.branch("hostel").loadMore;
      return state.status === "ready" ? (
        <ResourceTimeline.Root timeline={state.timeline}>
          <ResourceTimeline.Viewport>
            {state.visibleRows.map((row) => (
              <ResourceTimeline.Disclosure
                key={row.resource.id}
                row={row}
                expanded={!state.collapsedIds.has(row.resource.id)}
                onExpandedChange={() => state.toggleExpanded(row.resource.id)}
              />
            ))}
          </ResourceTimeline.Viewport>
        </ResourceTimeline.Root>
      ) : null;
    }
    const { root } = await render(<Capture coverage={{ [hostelKey]: { status: "pending" } }} />);
    await click("Expand Hostel");

    // The callback was made while the branch was pending; it is called after the branch loaded.
    await act(async () =>
      root.render(
        <Capture coverage={{ [hostelKey]: { status: "loaded", hasMore: true, cursor: "c2" } }} />,
      ),
    );
    await act(async () => loadMore?.());

    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ scope: { parentId: "hostel" }, cursor: "c2" });
  });
});
