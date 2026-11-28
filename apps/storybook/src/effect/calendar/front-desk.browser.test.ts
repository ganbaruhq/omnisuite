import { composeStories } from "@storybook/react-vite";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as stories from "../front-desk.stories";
const { Default } = composeStories(stories);
import type { TimelineWindow } from "@omnisuite/calendar-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";
import type { SampleEvent } from "./front-desk";
import {
  flatTimeline,
  sampleTimeline,
  type SampleBoard,
} from "@omnisuite/calendar-sample-data/sample-timeline";
import {
  createWindowQueries,
  type FetchWindow,
} from "@omnisuite/calendar-sample-data/window-queries";
import "../../styles.css";

// The Effect example's resource timeline in a real browser, loading its events window by window
// through application-owned queries, as the React example's loading tests do.

let reactRoot: Root | undefined;
let container: HTMLElement | undefined;
// A component that fails is only logged and blanks its part of the page, so every test also
// checks that nothing failed.
let logged: Array<string> = [];

beforeEach(async () => {
  logged = [];
  for (const method of ["log", "warn", "error"] as const) {
    const original = console[method].bind(console);
    vi.spyOn(console, method).mockImplementation((...args: Array<unknown>) => {
      logged.push(args.map(String).join(" "));
      original(...args);
    });
  }
  await page.viewport(1280, 900);
});

afterEach(async () => {
  reactRoot?.unmount();
  container?.remove();
  reactRoot = undefined;
  container = undefined;
  vi.restoreAllMocks();
  expect(logged.filter((line) => / failed /.test(line))).toEqual([]);
});

async function mount(input: SampleBoard, fetchWindow?: FetchWindow<SampleEvent>) {
  const queries = fetchWindow && createWindowQueries(fetchWindow);
  container = document.body.appendChild(document.createElement("div"));
  reactRoot = createRoot(container);
  reactRoot.render(
    createElement(() => Default({ boardProps: queries ? { input, queries } : { input } })),
  );
  await expect.poll(() => document.querySelector("[data-timeline-root]")).toBeTruthy();
}

/** A fetch that answers only when the test says so, in the order the test chooses. */
function controlledFetch() {
  const calls: {
    window: TimelineWindow;
    signal: AbortSignal;
    resolve(events: readonly SampleEvent[]): void;
    reject(error: unknown): void;
  }[] = [];
  const fetchWindow: FetchWindow<SampleEvent> = (window, signal) =>
    new Promise((resolve, reject) => calls.push({ window, signal, resolve, reject }));
  return { calls, fetchWindow };
}

const event = (id: string) => flatTimeline.events.find((candidate) => candidate.id === id)!;
const shown = (id: string) => document.querySelector<HTMLElement>(`[data-event-id="${id}"]`);
const rows = () => document.querySelectorAll("[data-timeline-row]");
const windowStatus = () =>
  document.querySelector<HTMLElement>("[data-timeline-window-status]")?.dataset.status;
const click = (name: string) => userEvent.click(page.getByRole("button", { name, exact: true }));

describe("the resource timeline", () => {
  it("draws the rooms, the days and the stays, each over its share of the range", async () => {
    await mount(flatTimeline);

    expect(rows()).toHaveLength(4);
    expect(document.querySelectorAll("[data-timeline-slot]")).toHaveLength(7);
    const lane = document.querySelector<HTMLElement>('[aria-label="Room 102 events"]')!;
    // The boiler service and the deep clean overlap, so they take a lane each.
    expect(lane.style.getPropertyValue("--timeline-lane-count")).toBe("2");
    const boiler = shown("boiler")!.getBoundingClientRect();
    const clean = shown("deep-clean")!.getBoundingClientRect();
    expect(boiler.width).toBeGreaterThan(0);
    expect(clean.top).toBeGreaterThanOrEqual(boiler.bottom - 1);
    // Wednesday is the third of seven days.
    const box = lane.getBoundingClientRect();
    expect((boiler.left - box.left) / box.width).toBeCloseTo((2 + 8 / 24) / 7, 2);
    expect(shown("emma")?.dataset.startsBefore).toBe("true");
    expect(page.getByRole("listitem", { name: /^Emma Laurent, / }).element()).toBeTruthy();
  });

  it("collapses and expands a branch from its disclosure", async () => {
    await mount(sampleTimeline);
    expect(rows()).toHaveLength(9);

    await click("Collapse First floor");

    await expect.poll(() => rows().length).toBe(5);
    const disclosure = page.getByRole("button", { name: "Expand First floor" }).element();
    expect(disclosure.getAttribute("aria-expanded")).toBe("false");
    expect(disclosure.getAttribute("aria-description")).toBe("Group, level 2");

    await click("Expand First floor");
    await expect.poll(() => rows().length).toBe(9);
  });

  it("lays the axis out again for another scale", async () => {
    await mount(flatTimeline);

    await click("Hour");

    await expect.poll(() => document.querySelectorAll("[data-timeline-slot]").length).toBe(24);
  });
});

describe("loading windows through application-owned queries", () => {
  it("asks for the shown window, naming its range, time zone and resource scope", async () => {
    const { calls, fetchWindow } = controlledFetch();
    await mount(flatTimeline, fetchWindow);

    await expect.poll(() => calls.length).toBe(1);
    expect(calls[0]!.window.range).toEqual({
      start: "2026-10-26T00:00:00Z",
      end: "2026-11-02T00:00:00Z",
    });
    expect(calls[0]!.window.timeZone).toBe("UTC");
    expect(calls[0]!.window.resourceScope).toEqual([
      "room-101",
      "room-102",
      "room-201",
      "room-202",
    ]);
    await expect.poll(windowStatus).toBe("pending");
    await expect.element(page.getByText("Loading events for this window…")).toBeVisible();
    expect(rows()).toHaveLength(4);
  });

  it("shows events that start before the window once it has loaded", async () => {
    const { calls, fetchWindow } = controlledFetch();
    await mount(flatTimeline, fetchWindow);
    await expect.poll(() => calls.length).toBe(1);

    calls[0]!.resolve([event("emma"), event("boiler")]);

    await expect.poll(windowStatus).toBe("loaded");
    expect(shown("emma")?.dataset.startsBefore).toBe("true");
    expect(shown("boiler")).not.toBeNull();
    expect(document.body.textContent).not.toContain("Loading events");
  });

  it("tells a window with no events from one that has not been loaded", async () => {
    const { calls, fetchWindow } = controlledFetch();
    await mount(flatTimeline, fetchWindow);
    await expect.poll(() => calls.length).toBe(1);

    calls[0]!.resolve([]);

    await expect.poll(windowStatus).toBe("loaded-empty");
    await expect.element(page.getByText("No stays or maintenance in this window.")).toBeVisible();
  });

  it("keeps loaded events while the next window is pending, and ends the last one", async () => {
    const { calls, fetchWindow } = controlledFetch();
    await mount(flatTimeline, fetchWindow);
    await expect.poll(() => calls.length).toBe(1);
    calls[0]!.resolve([event("lena")]);
    await expect.poll(windowStatus).toBe("loaded");

    await click("Next");

    await expect.poll(() => calls.length).toBe(2);
    expect(calls[1]!.window.range.start).toBe("2026-11-02T00:00:00Z");
    await expect.poll(windowStatus).toBe("pending");
    // Lena stays until 4 November, so she is in the next window too, while it loads.
    expect(shown("lena")).not.toBeNull();

    // Going back leaves the pending window, which nobody else observes, so it is cancelled.
    await click("Previous");
    await expect.poll(() => calls[1]!.signal.aborted).toBe(true);
    await expect.poll(windowStatus).toBe("loaded");
    expect(calls).toHaveLength(2);
  });

  it("shows a failure beside the window, keeps what is loaded, and retries only when asked", async () => {
    const { calls, fetchWindow } = controlledFetch();
    await mount(flatTimeline, fetchWindow);
    await expect.poll(() => calls.length).toBe(1);
    calls[0]!.resolve([event("lena")]);
    await click("Next");
    await expect.poll(() => calls.length).toBe(2);

    calls[1]!.reject(new Error("offline"));

    await expect.poll(windowStatus).toBe("failed");
    await expect.element(page.getByText(/Could not load events for this window/)).toBeVisible();
    expect(document.querySelector("[data-timeline-window-status]")?.getAttribute("aria-live")).toBe(
      "assertive",
    );
    expect(shown("lena")).not.toBeNull();
    // Nothing asks again by itself.
    expect(calls).toHaveLength(2);

    await click("Retry");

    await expect.poll(() => calls.length).toBe(3);
    expect(calls[2]!.window.key).toBe(calls[1]!.window.key);
    await expect.poll(windowStatus).toBe("pending");
    calls[2]!.resolve([]);
    await expect.poll(windowStatus).toBe("loaded-empty");
  });

  it("does not retry a failed window just because the viewer comes back to it", async () => {
    const { calls, fetchWindow } = controlledFetch();
    await mount(flatTimeline, fetchWindow);
    await expect.poll(() => calls.length).toBe(1);
    calls[0]!.reject(new Error("offline"));
    await expect.poll(windowStatus).toBe("failed");

    await click("Next");
    await expect.poll(() => calls.length).toBe(2);
    await click("Previous");

    await expect.poll(windowStatus).toBe("failed");
    expect(calls).toHaveLength(2);
  });

  it("asks for the window again when the time zone changes it", async () => {
    const { calls, fetchWindow } = controlledFetch();
    await mount(flatTimeline, fetchWindow);
    await expect.poll(() => calls.length).toBe(1);

    await click("Asia/Ho_Chi_Minh");

    await expect.poll(() => calls.length).toBe(2);
    expect(calls[1]!.window.timeZone).toBe("Asia/Ho_Chi_Minh");
    expect(calls[1]!.window.range.start).toBe("2026-10-25T17:00:00Z");
    expect(calls[0]!.signal.aborted).toBe(true);
  });
});
