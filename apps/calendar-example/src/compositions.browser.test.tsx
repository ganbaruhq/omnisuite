import type { TimelineWindow } from "@omnisuite/calendar-core";
import { act, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";
import { HousekeepingExample } from "./housekeeping-example";
import { ResourceTimelineExample } from "./resource-timeline-example";
import {
  createResourceQueries,
  createSampleResourceFetch,
  type FetchResources,
  type ResourcePage,
} from "./resource-queries";
import {
  flatTimeline,
  lazyServerEvents,
  lazyServerResources,
  sampleEditing,
} from "./sample-timeline";
import { Showcase } from "./showcase";
import { createSampleFetch, createWindowQueries, type FetchWindow } from "./window-queries";
import "./styles.css";

// Two compositions of one calendar, mounted together, the way an application would. The first has
// its resource label in a column beside each lane; the second stacks the label above the lane and
// renders its parts through `render`. They are checked against what the calendar promises, not
// against each other's markup.

let root: Root | undefined;
let container: HTMLElement | undefined;

async function render(node: ReactNode) {
  container = document.body.appendChild(document.createElement("div"));
  root = createRoot(container);
  await act(async () => root!.render(node));
}

beforeEach(async () => {
  await page.viewport(1280, 900);
});

afterEach(async () => {
  // The viewport belongs to the other test files too, so it goes back to the browser's default.
  await page.viewport(414, 896);
  await act(async () => root?.unmount());
  container?.remove();
  root = undefined;
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const settle = () => act(async () => sleep(50));

const roots = () => [...document.querySelectorAll<HTMLElement>("[data-timeline-root]")];
const front = () => roots()[0]!;
const housekeeping = () => roots()[1]!;
const viewportOf = (calendar: HTMLElement) =>
  calendar.querySelector<HTMLElement>("[data-timeline-viewport]")!;
const rowOf = (calendar: HTMLElement, id: string) =>
  calendar.querySelector<HTMLElement>(`[data-resource-id="${id}"]`);
const occurrenceIn = (calendar: HTMLElement, eventId: string, resourceId?: string) =>
  [
    ...calendar.querySelectorAll<HTMLElement>(`[data-timeline-event][data-event-id="${eventId}"]`),
  ].filter(
    (candidate) => !resourceId || candidate.closest(`[data-resource-id="${resourceId}"]`),
  )[0]!;
const toggleOf = (calendar: HTMLElement, name: string) =>
  [...calendar.querySelectorAll<HTMLElement>("[data-timeline-disclosure]")].find(
    (button) => button.getAttribute("aria-label") === name,
  )!;

function Both({
  frontProps,
  housekeepingProps,
}: {
  frontProps?: Partial<Parameters<typeof ResourceTimelineExample>[0]>;
  housekeepingProps?: Partial<Parameters<typeof HousekeepingExample>[0]>;
}) {
  return (
    <>
      <ResourceTimelineExample editing={sampleEditing} {...frontProps} />
      <HousekeepingExample editing={sampleEditing} {...housekeepingProps} />
    </>
  );
}

describe("two compositions of the same calendar", () => {
  it("each show nested groups and resources, parent events, shared and overlapping events", async () => {
    await render(<Both />);

    for (const calendar of [front(), housekeeping()]) {
      // Groups are headings, not resources; rooms hold beds.
      expect(calendar.querySelector('[data-group-id="hostel"]')?.getAttribute("data-depth")).toBe(
        "0",
      );
      expect(calendar.querySelector('[data-group-id="floor-1"]')?.getAttribute("data-depth")).toBe(
        "1",
      );
      expect(rowOf(calendar, "room-101")?.getAttribute("data-depth")).toBe("2");
      expect(rowOf(calendar, "bed-101-a")?.getAttribute("data-depth")).toBe("3");
      expect(calendar.querySelector('[data-resource-id="floor-1"]')).toBeNull();
      // A parent resource keeps its own events while it has children.
      expect(occurrenceIn(calendar, "emma", "room-101")).toBeTruthy();
      expect(occurrenceIn(calendar, "bed-check", "bed-101-a")).toBeTruthy();
      // One shared event, two renderings with the same interval.
      const drills = calendar.querySelectorAll<HTMLElement>('[data-event-id="fire-drill"]');
      expect(drills).toHaveLength(2);
      expect(new Set([...drills].map((drill) => drill.dataset.occurrenceId)).size).toBe(2);
      expect(drills[0]!.getBoundingClientRect().width).toBeCloseTo(
        drills[1]!.getBoundingClientRect().width,
        0,
      );
      // A one hour event is much narrower than a day slot, and still there (padding keeps it visible).
      const slot = calendar.querySelector("[data-timeline-slot]")!.getBoundingClientRect().width;
      expect(drills[0]!.getBoundingClientRect().width).toBeLessThan(slot / 2);
      // Overlapping events take their own lanes and the row grows.
      const boiler = occurrenceIn(calendar, "boiler");
      const clean = occurrenceIn(calendar, "deep-clean");
      expect(boiler.dataset.lane).not.toBe(clean.dataset.lane);
      expect(boiler.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        clean.getBoundingClientRect().top + 1,
      );
    }
  });

  it("lay the label beside the lane in one and above it in the other", async () => {
    await render(<Both />);

    const lane = (calendar: HTMLElement) =>
      rowOf(calendar, "room-102")!.querySelector("[data-timeline-lane]")!.getBoundingClientRect();
    const label = (calendar: HTMLElement) =>
      [...rowOf(calendar, "room-102")!.querySelectorAll("*")]
        .find((node) => node.textContent === "Room 102" && node.children.length === 0)!
        .getBoundingClientRect();
    // Beside: the label ends where the lane starts and sits within its height.
    expect(label(front()).right).toBeLessThanOrEqual(lane(front()).left + 1);
    expect(label(front()).top).toBeGreaterThanOrEqual(lane(front()).top - 1);
    expect(label(front()).bottom).toBeLessThanOrEqual(lane(front()).bottom + 1);
    // Above: the label ends before the lane's top edge.
    expect(label(housekeeping()).bottom).toBeLessThanOrEqual(lane(housekeeping()).top + 1);
  });

  it("keep the names, refs and structure of the parts a composition replaced", async () => {
    await render(<Both />);

    const calendar = housekeeping();
    // The second composition's elements are its own.
    expect(rowOf(calendar, "room-101")!.tagName).toBe("SECTION");
    expect(calendar.querySelector('[data-group-id="floor-1"]')!.tagName).toBe("HEADER");
    const noah = occurrenceIn(calendar, "noah");
    expect(noah.tagName).toBe("ARTICLE");
    expect(noah.dataset.slot).toBe("chip");
    // The parts' own roles and names still apply to them.
    expect(noah.getAttribute("role")).toBe("listitem");
    expect(noah.getAttribute("aria-label")).toBe("Noah Tran, 27 Oct, 12:00 – 30 Oct, 12:00");
    expect(rowOf(calendar, "room-101")!.getAttribute("aria-label")).toBe("Room 101");
    const toggle = toggleOf(calendar, "Collapse First floor");
    expect(toggle.dataset.slot).toBe("button");
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    // No control sits inside an event, in either composition.
    for (const event of document.querySelectorAll("[data-timeline-event]"))
      expect(event.querySelectorAll("button, a, input, select, textarea, [tabindex]")).toHaveLength(
        0,
      );
    // Events can be focused, and keep the shortcuts they advertise.
    expect(noah.tabIndex).toBe(0);
    expect(noah.getAttribute("aria-keyshortcuts")).toContain("Enter");
  });
});

describe("two calendars on one page", () => {
  beforeEach(async () => {
    // Narrow enough that the lanes scroll inside their viewports.
    await page.viewport(560, 900);
  });

  it("scroll independently", async () => {
    await render(<Both />);

    const [first, second] = [viewportOf(front()), viewportOf(housekeeping())];
    expect(first.scrollWidth).toBeGreaterThan(first.clientWidth);
    expect(second.scrollWidth).toBeGreaterThan(second.clientWidth);
    await act(async () => {
      first.scrollLeft = 200;
      await sleep(30);
    });
    expect(first.scrollLeft).toBeGreaterThan(0);
    expect(second.scrollLeft).toBe(0);
    await act(async () => {
      second.scrollLeft = 80;
      first.scrollLeft = 0;
      await sleep(30);
    });
    expect(second.scrollLeft).toBeGreaterThan(0);
    expect(first.scrollLeft).toBe(0);
  });

  it("expand and collapse independently", async () => {
    await render(<Both />);

    await userEvent.click(toggleOf(front(), "Collapse Second floor"));
    expect(rowOf(front(), "room-201")).toBeNull();
    expect(rowOf(housekeeping(), "room-201")).not.toBeNull();
    expect(toggleOf(housekeeping(), "Collapse Second floor").getAttribute("aria-expanded")).toBe(
      "true",
    );

    await userEvent.click(toggleOf(housekeeping(), "Collapse First floor"));
    expect(rowOf(housekeeping(), "room-101")).toBeNull();
    expect(rowOf(front(), "room-101")).not.toBeNull();
    // The first calendar's collapsed branch is still collapsed; opening it opens only that one.
    await userEvent.click(toggleOf(front(), "Expand Second floor"));
    expect(rowOf(front(), "room-201")).not.toBeNull();
    expect(rowOf(housekeeping(), "room-101")).toBeNull();
  });

  it("preview, hold focus and cancel independently", async () => {
    await render(<Both />);

    const lena = occurrenceIn(front(), "lena", "room-201");
    const lenaToo = occurrenceIn(housekeeping(), "lena", "room-201");
    lena.focus();
    await userEvent.keyboard("{Enter}{ArrowRight}");
    // The gesture and its preview belong to the calendar it started in.
    expect(front().dataset.gesture).toBe("keyboard");
    expect(housekeeping().dataset.gesture).toBeUndefined();
    expect(front().querySelectorAll("[data-timeline-preview]")).toHaveLength(1);
    expect(housekeeping().querySelectorAll("[data-timeline-preview]")).toHaveLength(0);
    expect(lena.dataset.dragging).toBe("true");
    expect(lenaToo.dataset.dragging).toBeUndefined();
    expect(document.activeElement).toBe(lena);

    // Focusing the other calendar's event ends the first gesture without a change, and does not
    // start one in the second.
    lenaToo.focus();
    await settle();
    expect(document.activeElement).toBe(lenaToo);
    expect(front().dataset.gesture).toBeUndefined();
    expect(front().dataset.cancelReason).toBe("blur");
    expect(housekeeping().dataset.gesture).toBeUndefined();
    expect(front().querySelectorAll("[data-timeline-preview]")).toHaveLength(0);

    // Escape in one calendar leaves the other's gesture alone.
    lena.focus();
    await userEvent.keyboard("{Enter}{ArrowRight}{Escape}");
    expect(front().dataset.cancelReason).toBe("escape");
    expect(housekeeping().dataset.cancelReason).toBeUndefined();
  });

  it("apply an accepted change to the calendar that proposed it", async () => {
    const proposals: string[] = [];
    await render(
      <Both
        frontProps={{ onProposal: () => proposals.push("front") }}
        housekeepingProps={{ onProposal: () => proposals.push("housekeeping") }}
      />,
    );

    const before = occurrenceIn(housekeeping(), "noah").getBoundingClientRect().left;
    const noah = occurrenceIn(front(), "noah");
    noah.focus();
    await userEvent.keyboard("{Enter}{ArrowRight}{ArrowRight}{Enter}");
    expect(proposals).toEqual(["front"]);
    await settle();
    // The first calendar owns its events; the second shows its own, unchanged.
    expect(occurrenceIn(housekeeping(), "noah").getBoundingClientRect().left).toBeCloseTo(
      before,
      0,
    );
    expect(housekeeping().querySelector("[data-timeline-preview]")).toBeNull();
  });
});

/** A server that never answers, so that what is observed stays observed. */
function silentWindows() {
  const signals: AbortSignal[] = [];
  const fetchWindow: FetchWindow<never> = (_window: TimelineWindow, signal) => {
    signals.push(signal);
    return new Promise(() => {});
  };
  return { signals, fetchWindow };
}

describe("lifecycle", () => {
  it("releases what one calendar observed without cancelling what another still observes", async () => {
    const { signals, fetchWindow } = silentWindows();
    const queries = createWindowQueries<never>(fetchWindow);
    const observe = vi.spyOn(queries, "observe");
    const released = vi.fn();
    const counted = {
      ...queries,
      observe: (window: TimelineWindow, context: { readonly retry: boolean }) => {
        const release = queries.observe(window, context);
        return () => {
          released();
          release();
        };
      },
    };
    let setShown: (shown: { front: boolean; housekeeping: boolean }) => void = () => {};
    function Shared() {
      const [shown, set] = useState({ front: true, housekeeping: true });
      setShown = set;
      return (
        <>
          {shown.front ? <ResourceTimelineExample input={flatTimeline} queries={counted} /> : null}
          {shown.housekeeping ? (
            <HousekeepingExample input={flatTimeline} queries={counted} />
          ) : null}
        </>
      );
    }
    await render(<Shared />);
    await settle();

    // Both calendars show the same window of the same rooms, so they share one request.
    expect(signals).toHaveLength(1);
    expect(observe.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(signals[0]!.aborted).toBe(false);

    await act(async () => setShown({ front: false, housekeeping: true }));
    await settle();
    expect(document.querySelectorAll("[data-timeline-root]")).toHaveLength(1);
    // The calendar that left released its observation; the one that stays still has the request.
    expect(released).toHaveBeenCalled();
    expect(signals[0]!.aborted).toBe(false);

    await act(async () => setShown({ front: false, housekeeping: false }));
    await settle();
    // Nobody observes it any more, so the application cancels it, and every observation ended.
    expect(signals[0]!.aborted).toBe(true);
    expect(released).toHaveBeenCalledTimes(observe.mock.calls.length);
  });

  it("stops calling an application's functions once its calendar has unmounted", async () => {
    let resolve: (page: ResourcePage) => void = () => {};
    const fetchResources: FetchResources = () =>
      new Promise((done) => {
        resolve = done;
      });
    const queries = createResourceQueries(fetchResources);
    const onLoad = vi.fn(queries.observe);
    function Host({ shown }: { shown: boolean }) {
      return shown ? (
        <HousekeepingExample
          input={{ resources: [], events: [] }}
          resourceQueries={{ ...queries, observe: onLoad }}
        />
      ) : null;
    }
    await render(<Host shown />);
    await settle();
    const calls = onLoad.mock.calls.length;
    expect(calls).toBeGreaterThan(0);

    await act(async () => root!.render(<Host shown={false} />));
    // A late response reaches the application's cache and nothing else.
    await act(async () => {
      resolve({ resources: [{ id: "late", title: "Late room" }] });
      await sleep(30);
    });
    expect(onLoad).toHaveBeenCalledTimes(calls);
    expect(document.querySelector("[data-timeline-root]")).toBeNull();
    expect(queries.getSnapshot().resources.map((resource) => resource.id)).toEqual(["late"]);
  });
});

describe("scoped retry in the second composition", () => {
  it("retries a failed branch and a failed window on their own", async () => {
    const resourceQueries = createResourceQueries(
      createSampleResourceFetch(lazyServerResources, {
        pageSize: 5,
        delayMs: 0,
        failFirst: ["annex"],
      }),
    );
    const queries = createWindowQueries(
      createSampleFetch(lazyServerEvents, { delayMs: 0, failUntilRetry: "2026-11-02T00:00" }),
    );
    await render(
      <HousekeepingExample
        input={{ resources: [], events: lazyServerEvents }}
        queries={queries}
        resourceQueries={resourceQueries}
      />,
    );
    await act(async () => sleep(100));

    // The annex's children fail once; the rest of the board stays where it was.
    await userEvent.click(toggleOf(roots()[0]!, "Expand Annex"));
    await act(async () => sleep(100));
    const retryBranch = page.getByRole("button", { name: "Retry loading Annex" });
    await expect.element(retryBranch).toBeVisible();
    expect(rowOf(roots()[0]!, "cottage-1")).not.toBeNull();
    await userEvent.click(retryBranch);
    await expect.poll(() => rowOf(roots()[0]!, "annex-1")).not.toBeNull();

    // The next week's window fails once, keeps what is loaded and loads on Retry.
    await userEvent.click(page.getByRole("button", { name: "Next" }));
    await act(async () => sleep(100));
    await expect.element(page.getByText(/Could not load tasks for this window/)).toBeVisible();
    expect(rowOf(roots()[0]!, "annex-1")).not.toBeNull();
    await userEvent.click(page.getByRole("button", { name: "Retry", exact: true }));
    await expect
      .element(page.getByText(/Could not load tasks for this window/))
      .not.toBeInTheDocument();
  });
});

describe("a phone", () => {
  beforeEach(async () => {
    await page.viewport(390, 844);
  });

  const pageOverflow = () =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth;

  it("scrolls within each calendar and never across the page", async () => {
    await render(<Showcase />);
    await act(async () => sleep(700));

    expect(roots()).toHaveLength(2);
    expect(pageOverflow()).toBeLessThanOrEqual(0);
    for (const calendar of roots()) {
      const viewport = viewportOf(calendar);
      expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
      const box = viewport.getBoundingClientRect();
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(window.innerWidth + 1);
      await act(async () => {
        viewport.scrollLeft = 150;
        viewport.scrollTop = 10;
        await sleep(30);
      });
      expect(viewport.scrollLeft).toBeGreaterThan(0);
    }
    // Scrolling inside the calendars did not move the page sideways.
    expect(window.scrollX).toBe(0);
    expect(pageOverflow()).toBeLessThanOrEqual(0);
  });

  it("fits the toolbar and every scale in the width of the screen", async () => {
    await render(<Showcase />);
    await act(async () => sleep(300));

    for (const scale of ["Hour", "Day", "Week", "Month"]) {
      for (const label of ["Scale", "Housekeeping scale"]) {
        await userEvent.click(
          page.getByRole("group", { name: label }).getByRole("button", { name: scale }),
        );
        await settle();
        expect(pageOverflow()).toBeLessThanOrEqual(0);
      }
    }
    for (const group of document.querySelectorAll(
      "[role=group][aria-label*=scale i], [role=group][aria-label=Scale]",
    ))
      expect(group.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth + 1);
  });

  it("adds no snap step selector, event details popover or touch editing control", async () => {
    await render(<Both />);

    expect(page.getByText(/snap/i).elements()).toHaveLength(0);
    expect(document.querySelector("select, [role=slider], [role=spinbutton]")).toBeNull();
    // Clicking an event opens nothing of its own.
    await userEvent.click(occurrenceIn(front(), "emma", "room-101"));
    await userEvent.click(occurrenceIn(housekeeping(), "emma", "room-101"));
    expect(
      document.querySelector("[role=dialog], [popover], [data-slot=popover-content]"),
    ).toBeNull();
  });
});

describe("a desktop", () => {
  it("keeps the keyboard and the mouse for editing in both compositions", async () => {
    const proposals: { calendar: string; operation: string }[] = [];
    await render(
      <Both
        frontProps={{
          input: flatTimeline,
          onProposal: (proposal) =>
            proposals.push({ calendar: "front", operation: proposal.operation }),
        }}
        housekeepingProps={{
          input: flatTimeline,
          onProposal: (proposal) =>
            proposals.push({ calendar: "housekeeping", operation: proposal.operation }),
        }}
      />,
    );

    // The keyboard moves and resizes an event in each calendar.
    for (const calendar of [front(), housekeeping()]) {
      occurrenceIn(calendar, "boiler").focus();
      await userEvent.keyboard("{Enter}{ArrowRight}{Enter}");
      occurrenceIn(calendar, "boiler").focus();
      await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}{Enter}");
    }
    expect(proposals).toEqual([
      { calendar: "front", operation: "move" },
      { calendar: "front", operation: "resize" },
      { calendar: "housekeeping", operation: "move" },
      { calendar: "housekeeping", operation: "resize" },
    ]);

    // The mouse moves one by holding and dragging, through the second composition's own elements.
    proposals.length = 0;
    const noah = occurrenceIn(housekeeping(), "noah", "room-101");
    const lane = noah.closest("[data-timeline-lane]")!.getBoundingClientRect();
    const box = noah.getBoundingClientRect();
    const start = { x: box.left + 20, y: box.top + box.height / 2 };
    const fire = (type: string, target: EventTarget, point: { x: number; y: number }) =>
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
    await act(async () => {
      fire("pointerdown", noah, start);
      await sleep(300);
    });
    const end = { x: start.x + lane.width / 7, y: start.y };
    await act(async () => {
      fire("pointermove", document, end);
      await sleep(30);
    });
    expect(housekeeping().dataset.gesture).toBe("pointer");
    expect(housekeeping().querySelector("[data-timeline-preview]")).not.toBeNull();
    expect(front().dataset.gesture).toBeUndefined();
    await act(async () => {
      fire("pointerup", document, end);
      await sleep(60);
    });
    expect(proposals).toEqual([{ calendar: "housekeeping", operation: "move" }]);
  });
});

// The sample data and the showcase page are what the production build serves.
describe("the showcase page", () => {
  it("renders both compositions with the sample's hierarchy as it loads", async () => {
    await render(<Showcase />);
    await act(async () => sleep(900));

    expect(roots()).toHaveLength(2);
    for (const calendar of roots()) {
      expect(calendar.querySelector('[data-group-id="hostel"]')).not.toBeNull();
      expect(
        calendar.querySelector("[data-timeline-scope-status], [data-timeline-list-end]"),
      ).not.toBeNull();
    }
  });
});
