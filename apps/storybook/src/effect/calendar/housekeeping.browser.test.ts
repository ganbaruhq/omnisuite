import { composeStories } from "@storybook/react-vite";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as stories from "../housekeeping.stories";
const { Light } = composeStories(stories);
import { occurrenceIdOf } from "@omnisuite/calendar-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";
import type { BoardProps } from "./props";
import {
  createResourceQueries,
  createSampleResourceFetch,
} from "@omnisuite/calendar-sample-data/resource-queries";
import {
  flatTimeline,
  lazyServerEvents,
  lazyServerResources,
  sampleEditing,
} from "@omnisuite/calendar-sample-data/sample-timeline";
import {
  createSampleFetch,
  createWindowQueries,
} from "@omnisuite/calendar-sample-data/window-queries";
import "../../styles.css";

// The Effect example's editable calendar in a real browser: events moved and resized from the
// keyboard, with the application applying what is proposed, and rooms loaded a page or a branch
// at a time, as the React example's editing and resource tests do.

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

function launch(props: BoardProps) {
  container = document.body.appendChild(document.createElement("div"));
  reactRoot = createRoot(container);
  reactRoot.render(createElement(() => Light({ boardProps: props })));
}

/** The flat board with its events loaded at once, editable, applying what it proposes. */
async function mountEditable() {
  const queries = createWindowQueries(createSampleFetch(flatTimeline.events, { delayMs: 0 }));
  launch({ input: flatTimeline, queries, editing: sampleEditing });
  await expect.poll(() => shown("boiler")).toBeTruthy();
  return queries;
}

const shown = (id: string, resourceId?: string) =>
  document.querySelector<HTMLElement>(
    resourceId === undefined
      ? `[data-event-id="${id}"][data-timeline-event]`
      : `[data-occurrence-id='${occurrenceIdOf(id, resourceId)}']`,
  );
const root = () => document.querySelector<HTMLElement>("[data-timeline-root]")!;
const preview = () => document.querySelector<HTMLElement>("[data-timeline-preview]");
const status = () => document.querySelector("[data-timeline-status]")?.textContent ?? "";
const rowTitles = () =>
  [...document.querySelectorAll("[data-timeline-row]")].map((row) =>
    row.getAttribute("aria-label"),
  );
const click = (name: string) => userEvent.click(page.getByRole("button", { name, exact: true }));

describe("editing from the keyboard", () => {
  it("moves by a snap step and a row, then drops on Enter and keeps the focus", async () => {
    const queries = await mountEditable();
    const boiler = shown("boiler", "room-102")!;
    expect(boiler.tabIndex).toBe(0);
    expect(boiler.getAttribute("aria-keyshortcuts")).toBe(
      "Enter Space Alt+ArrowLeft Alt+ArrowRight Shift+ArrowLeft Shift+ArrowRight",
    );
    boiler.focus();

    await userEvent.keyboard("{Enter}");
    expect(root().dataset.gesture).toBe("keyboard");
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowDown}");
    expect(preview()!.closest("[data-resource-id]")!.getAttribute("data-resource-id")).toBe(
      "room-201",
    );
    expect(status()).toMatch(/^Move Boiler service to Room 201/);
    // The dragged rendering only keeps its place while the preview stands in for it.
    expect(getComputedStyle(boiler).opacity).toBe("0");

    await userEvent.keyboard("{Enter}");

    await expect.poll(() => shown("boiler", "room-201")).toBeTruthy();
    const moved = queries.getSnapshot().events.find((event) => event.id === "boiler")!;
    expect(moved).toMatchObject({
      resourceIds: ["room-201"],
      start: "2026-10-28T10:00:00Z",
      end: "2026-10-28T19:00:00Z",
    });
    // Focus follows the moved event to its new rendering.
    await expect
      .poll(() => (document.activeElement as HTMLElement | null)?.dataset.occurrenceId)
      .toBe(occurrenceIdOf("boiler", "room-201"));
    expect(root().dataset.gesture).toBeUndefined();
    expect(preview()).toBeNull();
  });

  it("resizes the end edge with Shift and an arrow", async () => {
    const queries = await mountEditable();
    shown("boiler", "room-102")!.focus();

    await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}");
    expect(root().dataset.operation).toBe("resize");
    await userEvent.keyboard("{Enter}");

    await expect
      .poll(() => queries.getSnapshot().events.find((event) => event.id === "boiler")?.end)
      .toBe("2026-10-28T18:00:00Z");
  });

  it("cancels on Escape, proposing nothing", async () => {
    const queries = await mountEditable();
    const before = queries.getSnapshot().events;
    shown("boiler", "room-102")!.focus();

    await userEvent.keyboard("{Enter}{ArrowLeft}{Escape}");

    expect(root().dataset.gesture).toBeUndefined();
    expect(root().dataset.cancelReason).toBe("escape");
    expect(preview()).toBeNull();
    expect(queries.getSnapshot().events).toBe(before);
    expect(document.activeElement).toBe(shown("boiler", "room-102"));
  });

  it("cancels when focus leaves the event", async () => {
    const queries = await mountEditable();
    const before = queries.getSnapshot().events;
    shown("boiler", "room-102")!.focus();

    await userEvent.keyboard("{Enter}{ArrowRight}");
    await userEvent.tab();

    expect(root().dataset.cancelReason).toBe("blur");
    expect(queries.getSnapshot().events).toBe(before);
  });
});

describe("loading rooms a page or a branch at a time", () => {
  it("loads the top level as the list end shows, and a branch when it is expanded", async () => {
    const resourceQueries = createResourceQueries(
      createSampleResourceFetch(lazyServerResources, {
        pageSize: 5,
        delayMs: 0,
        failFirst: ["annex"],
      }),
    );
    launch({ input: { resources: [], events: lazyServerEvents }, resourceQueries });

    await expect.poll(() => rowTitles()).toContain("Riverside");
    expect(rowTitles()).not.toContain("First floor");

    await click("Expand Riverside");
    await expect.poll(() => rowTitles()).toEqual(expect.arrayContaining(["First floor"]));
    expect(rowTitles()).toContain("Second floor");

    // The first request for the annex fails, and says so assertively under it.
    await click("Expand Annex");
    const annex = () =>
      document.querySelector<HTMLElement>('[data-timeline-scope-status][data-parent-id="annex"]');
    await expect.poll(() => annex()?.dataset.status).toBe("failed");
    expect(annex()!.getAttribute("aria-live")).toBe("assertive");
    expect(annex()!.textContent).toContain("Could not load what is under Annex.");

    await click("Retry loading Annex");
    await expect.poll(() => rowTitles()).toContain("Annex room 5");
    expect(rowTitles()).not.toContain("Annex room 6");
    expect(annex()!.dataset.hasMore).toBe("true");

    await click("Load more under Annex");
    await expect.poll(() => rowTitles()).toContain("Annex room 10");
  });
});
