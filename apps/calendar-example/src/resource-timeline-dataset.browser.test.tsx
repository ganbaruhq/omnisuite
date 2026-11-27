import type { EditingInput, EventProposal } from "@omnisuite/calendar-core";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";
import {
  baselineDataset,
  datasetBoard,
  datasetResources,
  datasetRange,
  sharedDataset,
  type DatasetOptions,
} from "./dataset";
import { createResourceQueries, createSampleResourceFetch } from "./resource-queries";
import { ResourceTimelineExample } from "./resource-timeline-example";
import { createSampleFetch, createWindowQueries } from "./window-queries";
import "./styles.css";

// The calendar is verified at the size the first release is meant for: 100 resources with 1,000
// unique events and 1,000 placements, and a second fixture with 1,000 events and 2,000 placements.
// Every scenario checks that scrolling, loading and editing give the same correct result at that
// size. No test asserts how long anything took: no latency was agreed. The timings are observed and
// printed (`[dataset]` lines) so that a run can be recorded with its environment.

type Proposal = EventProposal<{ kind: "stay" | "maintenance" }>;

const hour = 3_600_000;
// No rule, so that a gesture on any generated event can be proposed.
const editing: EditingInput<{ kind: "stay" | "maintenance" }> = {
  snap: "PT1H",
  startEditable: true,
  resourceEditable: true,
  durationEditable: true,
};

let root: Root | undefined;
let container: HTMLElement | undefined;
let proposals: Proposal[];
let observations: Record<string, number>;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const frame = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

/** Runs a step to the end of the next frame and notes how long it took, in milliseconds. */
async function timed<T>(label: string, step: () => Promise<T> | T): Promise<T> {
  const started = performance.now();
  const result = await step();
  await frame();
  observations[label] = Math.round((performance.now() - started) * 10) / 10;
  return result;
}

async function mount(node: ReactNode) {
  container = document.body.appendChild(document.createElement("div"));
  root = createRoot(container);
  await act(async () => root!.render(node));
}

beforeEach(async () => {
  proposals = [];
  observations = {};
  await page.viewport(1280, 900);
});

afterEach(async () => {
  await page.viewport(414, 896);
  await act(async () => root?.unmount());
  container?.remove();
  root = undefined;
});

/** The environment and timings of one scenario, as a line to copy into the README. */
function report(fixture: string, extra: Record<string, unknown> = {}) {
  const memory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
  console.info(
    "[dataset]",
    JSON.stringify({
      fixture,
      browser: navigator.userAgent.match(/(?:Headless)?Chrome\/[\d.]+/)?.[0],
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      dpr: window.devicePixelRatio,
      cores: navigator.hardwareConcurrency,
      domNodes: document.getElementsByTagName("*").length,
      heapMB: memory ? Math.round(memory.usedJSHeapSize / 1048576) : undefined,
      ...extra,
      ms: observations,
    }),
  );
}

const all = (selector: string) => [...document.querySelectorAll<HTMLElement>(selector)];
const viewport = () => document.querySelector<HTMLElement>("[data-timeline-viewport]")!;
const occurrences = () => all("[data-timeline-event]");
const rowOf = (id: string) => document.querySelector<HTMLElement>(`[data-resource-id="${id}"]`)!;
const laneOf = (id: string) => rowOf(id).querySelector<HTMLElement>("[data-timeline-lane]")!;
const toggleOf = (name: string) =>
  all("[data-timeline-disclosure]").find((button) => button.getAttribute("aria-label") === name)!;

/** Every rendering lies inside its lane. */
function expectPlacedInsideLanes() {
  const lanes = new Map<string, DOMRect>();
  for (const occurrence of occurrences()) {
    const lane = occurrence.closest<HTMLElement>("[data-timeline-lane]")!;
    const id = occurrence.closest<HTMLElement>("[data-resource-id]")!.dataset.resourceId!;
    const bounds = lanes.get(id) ?? lane.getBoundingClientRect();
    lanes.set(id, bounds);
    const box = occurrence.getBoundingClientRect();
    expect(box.left).toBeGreaterThanOrEqual(bounds.left - 1);
    expect(box.right).toBeLessThanOrEqual(bounds.right + 1);
    expect(box.top).toBeGreaterThanOrEqual(bounds.top - 1);
    expect(box.bottom).toBeLessThanOrEqual(bounds.bottom + 1);
  }
}

/** The renderings in one lane of a row, left to right, must not overlap each other. */
function expectLanesDoNotOverlap(resourceId: string) {
  const byLane = new Map<string, DOMRect[]>();
  for (const occurrence of rowOf(resourceId).querySelectorAll<HTMLElement>(
    "[data-timeline-event]",
  )) {
    const key = occurrence.dataset.lane!;
    byLane.set(key, [...(byLane.get(key) ?? []), occurrence.getBoundingClientRect()]);
  }
  for (const boxes of byLane.values()) {
    boxes.sort((a, b) => a.left - b.left);
    boxes.forEach((box, index) => {
      if (index > 0) expect(box.left).toBeGreaterThanOrEqual(boxes[index - 1]!.right - 1);
    });
  }
}

function fire(type: string, target: EventTarget, point: { x: number; y: number }) {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
      button: 0,
      buttons: type === "pointerup" ? 0 : 1,
      clientX: point.x,
      clientY: point.y,
    }),
  );
}

const centre = (box: DOMRect) => ({ x: box.left + box.width / 2, y: box.top + box.height / 2 });

async function mountDataset(options: DatasetOptions) {
  const board = datasetBoard(options);
  await timed("mount", () =>
    mount(
      <ResourceTimelineExample
        input={board}
        editing={editing}
        onProposal={(proposal) => proposals.push(proposal)}
      />,
    ),
  );
  return board;
}

const placementsOf = (options: DatasetOptions) => options.events * options.resourcesPerEvent;

describe("100 resources, 1,000 events and 1,000 placements", () => {
  it("renders every resource and placement, in the right place", async () => {
    const board = await mountDataset(baselineDataset);

    expect(all("[data-resource-id]")).toHaveLength(100);
    expect(all("[data-group-id]")).toHaveLength(10);
    expect(occurrences()).toHaveLength(placementsOf(baselineDataset));
    expect(new Set(occurrences().map((occurrence) => occurrence.dataset.eventId)).size).toBe(1000);
    expect(board.events).toHaveLength(1000);
    // Events overlap, so rows grow to several lanes; every rendering still lies inside its lane.
    expect(
      Math.max(...occurrences().map((occurrence) => Number(occurrence.dataset.lane))),
    ).toBeGreaterThan(0);
    expectPlacedInsideLanes();
    for (const id of ["room-1", "room-37", "room-100"]) expectLanesDoNotOverlap(id);
    // The span of an event is its share of the week, whatever the size of the dataset.
    const sample = board.events.find((event) => event.resourceIds[0] === "room-5")!;
    const lane = laneOf("room-5").getBoundingClientRect();
    const box = document
      .querySelector<HTMLElement>(`[data-event-id="${sample.id}"]`)!
      .getBoundingClientRect();
    const week = Date.parse(datasetRange.end) - Date.parse(datasetRange.start);
    expect(box.width).toBeCloseTo(
      (lane.width * (Date.parse(sample.end) - Date.parse(sample.start))) / week,
      0,
    );
    report("baseline", { resources: 100, events: 1000, placements: 1000 });
  });

  it("scrolls to the last resource and the end of the week", async () => {
    await mountDataset(baselineDataset);
    await page.viewport(800, 900);
    await frame();

    const scroller = viewport();
    expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight * 5);
    await timed("scroll to the last row", async () => {
      scroller.scrollTop = scroller.scrollHeight;
    });
    const last = rowOf("room-100").getBoundingClientRect();
    const frameBox = scroller.getBoundingClientRect();
    expect(last.bottom).toBeLessThanOrEqual(frameBox.bottom + 1);
    expect(last.bottom).toBeGreaterThan(frameBox.bottom - 120);
    // Events in the last rows are in view and have their own boxes.
    expect(
      all('[data-resource-id="room-100"] [data-timeline-event]').every(
        (box) => box.getBoundingClientRect().height > 0,
      ),
    ).toBe(true);

    expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
    await timed("scroll to the end of the week", async () => {
      scroller.scrollLeft = scroller.scrollWidth;
    });
    expect(laneOf("room-100").getBoundingClientRect().right).toBeLessThanOrEqual(
      frameBox.right + 1,
    );
    await timed("scroll back to the top", async () => {
      scroller.scrollLeft = 0;
      scroller.scrollTop = 0;
    });
    expect(rowOf("room-1").getBoundingClientRect().top).toBeGreaterThanOrEqual(frameBox.top - 1);
    report("baseline scroll", { resources: 100, events: 1000, placements: 1000 });
  });

  it("collapses and expands a floor with its events", async () => {
    const board = await mountDataset(baselineDataset);
    const onFloor = (id: string) => {
      const room = Number(id.replace("room-", ""));
      return room >= 1 && room <= 10;
    };
    const hidden = board.events.reduce(
      (count, event) => count + event.resourceIds.filter(onFloor).length,
      0,
    );
    expect(hidden).toBeGreaterThan(0);

    await timed("collapse a floor", () => toggleOf("Collapse Floor 1").click());
    expect(all("[data-resource-id]")).toHaveLength(90);
    expect(occurrences()).toHaveLength(1000 - hidden);
    expect(rowOf("room-1")).toBeNull();
    await timed("expand a floor", () => toggleOf("Expand Floor 1").click());
    expect(all("[data-resource-id]")).toHaveLength(100);
    expect(occurrences()).toHaveLength(1000);
    expectLanesDoNotOverlap("room-1");
    report("baseline collapse", { resources: 100, events: 1000, placements: 1000 });
  });

  it("moves, reassigns and resizes with the same result as a small board", async () => {
    await mountDataset(baselineDataset);
    const lane = laneOf("room-1").getBoundingClientRect();
    const hourWidth = lane.width / 168;

    // The keyboard moves an event an hour later, and the controlled board shows it there.
    const moved = occurrences().find(
      (occurrence) =>
        occurrence.closest("[data-resource-id]")!.getAttribute("data-resource-id") === "room-1" &&
        occurrence.getBoundingClientRect().right + hourWidth * 2 < lane.right,
    )!;
    const before = moved.getBoundingClientRect().left;
    const id = moved.dataset.eventId!;
    await timed("keyboard move", async () => {
      moved.focus();
      await userEvent.keyboard("{Enter}{ArrowRight}{Enter}");
    });
    expect(proposals).toHaveLength(1);
    expect(proposals[0]!.eventId).toBe(id);
    expect(Date.parse(proposals[0]!.after.start) - Date.parse(proposals[0]!.before.start)).toBe(
      hour,
    );
    const after = document.querySelector<HTMLElement>(`[data-event-id="${id}"]`)!;
    expect(after.getBoundingClientRect().left - before).toBeCloseTo(hourWidth, 0);
    expect(occurrences()).toHaveLength(1000);

    // The pointer drags another event, held first, to the row below and three hours later.
    const dragged = occurrences().find(
      (occurrence) =>
        occurrence.closest("[data-resource-id]")!.getAttribute("data-resource-id") === "room-2" &&
        occurrence.dataset.eventId !== id &&
        occurrence.getBoundingClientRect().right + hourWidth * 4 < lane.right,
    )!;
    const draggedId = dragged.dataset.eventId!;
    const from = centre(dragged.getBoundingClientRect());
    const target = rowOf("room-3").getBoundingClientRect();
    const to = { x: from.x + hourWidth * 3, y: target.top + target.height / 2 };
    await act(async () => {
      fire("pointerdown", dragged, from);
      await sleep(300);
    });
    await timed("pointer move to another row", async () => {
      await act(async () => {
        fire("pointermove", document, to);
        await sleep(30);
      });
      await act(async () => {
        fire("pointerup", document, to);
        await sleep(30);
      });
    });
    expect(proposals).toHaveLength(2);
    expect(proposals[1]!.eventId).toBe(draggedId);
    expect(proposals[1]!.after.resourceIds).toEqual(["room-3"]);
    expect(Date.parse(proposals[1]!.after.start) - Date.parse(proposals[1]!.before.start)).toBe(
      3 * hour,
    );
    expect(
      document
        .querySelector(`[data-event-id="${draggedId}"]`)!
        .closest("[data-resource-id]")!
        .getAttribute("data-resource-id"),
    ).toBe("room-3");
    expect(occurrences()).toHaveLength(1000);

    // A handle drags the end of an event two hours later and keeps the start.
    const resized = occurrences().find(
      (occurrence) =>
        occurrence.closest("[data-resource-id]")!.getAttribute("data-resource-id") === "room-4" &&
        occurrence.getBoundingClientRect().right + hourWidth * 4 < lane.right,
    )!;
    const resizedId = resized.dataset.eventId!;
    const handle = resized.querySelector<HTMLElement>('[data-edge="end"]')!.getBoundingClientRect();
    const grip = centre(handle);
    await timed("pointer resize", async () => {
      await act(async () => {
        fire("pointerdown", resized.querySelector('[data-edge="end"]')!, grip);
        await sleep(30);
      });
      await act(async () => {
        fire("pointermove", document, { x: grip.x + hourWidth * 2, y: grip.y });
        await sleep(30);
      });
      await act(async () => {
        fire("pointerup", document, { x: grip.x + hourWidth * 2, y: grip.y });
        await sleep(30);
      });
    });
    expect(proposals).toHaveLength(3);
    expect(proposals[2]!.eventId).toBe(resizedId);
    expect(proposals[2]!.operation).toBe("resize");
    expect(proposals[2]!.after.start).toBe(proposals[2]!.before.start);
    expect(Date.parse(proposals[2]!.after.end) - Date.parse(proposals[2]!.before.end)).toBe(
      2 * hour,
    );
    expect(occurrences()).toHaveLength(1000);
    expectLanesDoNotOverlap("room-3");
    report("baseline editing", { resources: 100, events: 1000, placements: 1000 });
  });
});

describe("1,000 events and 2,000 placements", () => {
  it("renders each event once for each resource, and keeps them in step", async () => {
    await mountDataset(sharedDataset);

    expect(all("[data-resource-id]")).toHaveLength(100);
    expect(occurrences()).toHaveLength(placementsOf(sharedDataset));
    const byEvent = new Map<string, HTMLElement[]>();
    for (const occurrence of occurrences())
      byEvent.set(occurrence.dataset.eventId!, [
        ...(byEvent.get(occurrence.dataset.eventId!) ?? []),
        occurrence,
      ]);
    // 1,000 events, not 2,000: each is on two rooms, with different occurrences and one interval.
    expect(byEvent.size).toBe(1000);
    for (const pair of byEvent.values()) {
      expect(pair).toHaveLength(2);
      expect(pair[0]!.dataset.occurrenceId).not.toBe(pair[1]!.dataset.occurrenceId);
      const [first, second] = pair.map((occurrence) => occurrence.getBoundingClientRect());
      expect(first!.left).toBeCloseTo(second!.left, 0);
      expect(first!.width).toBeCloseTo(second!.width, 0);
    }
    expectPlacedInsideLanes();

    // Moving one rendering moves the other: it is one event.
    const lane = laneOf("room-1").getBoundingClientRect();
    const hourWidth = lane.width / 168;
    const moved = occurrences().find(
      (occurrence) =>
        occurrence.closest("[data-resource-id]")!.getAttribute("data-resource-id") === "room-1" &&
        occurrence.getBoundingClientRect().right + hourWidth * 2 < lane.right,
    )!;
    const id = moved.dataset.eventId!;
    const [near, far] = byEvent
      .get(id)!
      .map((occurrence) => occurrence.getBoundingClientRect().left);
    await timed("keyboard move of a shared event", async () => {
      moved.focus();
      await userEvent.keyboard("{Enter}{ArrowRight}{Enter}");
    });
    expect(proposals).toHaveLength(1);
    expect(proposals[0]!.after.resourceIds).toEqual(proposals[0]!.before.resourceIds);
    const now = [...document.querySelectorAll<HTMLElement>(`[data-event-id="${id}"]`)];
    expect(now).toHaveLength(2);
    expect(now[0]!.getBoundingClientRect().left - near!).toBeCloseTo(hourWidth, 0);
    expect(now[1]!.getBoundingClientRect().left - far!).toBeCloseTo(hourWidth, 0);
    expect(occurrences()).toHaveLength(2000);
    report("shared", { resources: 100, events: 1000, placements: 2000 });
  });

  it("collapses and expands floors without losing a placement", async () => {
    await mountDataset(sharedDataset);

    await timed("collapse a floor", () => toggleOf("Collapse Floor 3").click());
    const remaining = occurrences().length;
    expect(remaining).toBeLessThan(2000);
    expect(all("[data-resource-id]")).toHaveLength(90);
    await timed("expand a floor", () => toggleOf("Expand Floor 3").click());
    expect(occurrences()).toHaveLength(2000);
    report("shared collapse", { resources: 100, events: 1000, placements: 2000 });
  });
});

describe("loading at the baseline size", () => {
  it("pages 100 resources as the list is scrolled and loads the week's 1,000 events", async () => {
    const board = datasetBoard(baselineDataset);
    // The server holds the rooms as one long list, in pages of 25, and the events by window.
    const rooms = datasetResources(100).filter((node) => node.kind !== "group");
    const resourceQueries = createResourceQueries(
      createSampleResourceFetch(
        rooms.map(({ id, title }) => ({ id, title })),
        {
          pageSize: 25,
          delayMs: 0,
        },
      ),
    );
    const queries = createWindowQueries(createSampleFetch(board.events, { delayMs: 0 }));
    await timed("mount", () =>
      mount(
        <ResourceTimelineExample
          input={{ resources: [], events: [] }}
          editing={editing}
          queries={queries}
          resourceQueries={resourceQueries}
          onProposal={(proposal) => proposals.push(proposal)}
        />,
      ),
    );

    // A page of 25 does not fill the list; the end of the list asks for the next page when it
    // comes into view, until the terminal page stops it.
    const started = performance.now();
    await expect
      .poll(
        async () => {
          viewport().scrollTop = viewport().scrollHeight;
          await frame();
          return all("[data-resource-id]").length;
        },
        { timeout: 20_000, interval: 50 },
      )
      .toBe(100);
    observations["page in 100 resources"] = Math.round(performance.now() - started);
    await expect.poll(() => occurrences().length, { timeout: 20_000 }).toBe(1000);
    observations["all events shown"] = Math.round(performance.now() - started);
    // The terminal page stops further requests: waiting does not change what is shown.
    await act(async () => sleep(300));
    expect(all("[data-resource-id]")).toHaveLength(100);
    expect(all("[data-timeline-list-end]")[0]!.dataset.hasMore).toBeUndefined();

    // Another week holds no events, and says so; the week before is still there on return.
    await timed("next week, nothing in it", async () => {
      await page.getByRole("button", { name: "Next" }).click();
    });
    await expect.element(page.getByText("No stays or maintenance in this window.")).toBeVisible();
    expect(occurrences()).toHaveLength(0);
    expect(all("[data-resource-id]")).toHaveLength(100);
    await timed("previous week, from the cache", async () => {
      await page.getByRole("button", { name: "Previous" }).click();
    });
    await expect.poll(() => occurrences().length, { timeout: 5000 }).toBe(1000);
    report("loading", { resources: 100, events: 1000, placements: 1000, pageSize: 25 });
  });
});
