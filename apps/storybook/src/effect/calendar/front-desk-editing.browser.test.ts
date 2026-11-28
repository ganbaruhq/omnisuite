import { composeStories } from "@storybook/react-vite";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as stories from "../front-desk.stories";
const { Default } = composeStories(stories);
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";
import type { SampleProposal } from "./front-desk";
import { flatTimeline, sampleEditing } from "@omnisuite/calendar-sample-data/sample-timeline";
import {
  createSampleFetch,
  createWindowQueries,
} from "@omnisuite/calendar-sample-data/window-queries";
import "../../styles.css";

// The Effect example's board edited by a pointer in a real browser, as the React example's
// editing tests do: a move is held before it begins, a resize handle follows at once, and the
// application decides what a proposal changes.

let reactRoot: Root | undefined;
let container: HTMLElement | undefined;
let logged: Array<string> = [];
let proposals: SampleProposal[];

beforeEach(async () => {
  pointerType = "mouse";
  logged = [];
  proposals = [];
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
  // The viewport belongs to the other test files too, so it goes back to the browser's default.
  await page.viewport(414, 896);
  vi.restoreAllMocks();
  expect(logged.filter((line) => / failed /.test(line))).toEqual([]);
});

/** The board, loading the hostel's flat rooms in the week of 26 October, editable by the hour. */
async function mount({ acceptProposals = true } = {}) {
  const queries = createWindowQueries(createSampleFetch(flatTimeline.events, { delayMs: 0 }));
  container = document.body.appendChild(document.createElement("div"));
  reactRoot = createRoot(container);
  reactRoot.render(
    createElement(() =>
      Default({
        boardProps: { input: flatTimeline, queries, editing: sampleEditing, acceptProposals },
        onProposal: (proposal) => proposals.push(proposal),
      }),
    ),
  );
  await expect.poll(() => occurrence("boiler")).toBeTruthy();
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
// Longer than the 200ms the pointer must be held for a move to begin.
const holdTime = 300;
const weekStart = Date.parse("2026-10-26T00:00Z");
const hour = 3_600_000;

const element = (selector: string) => document.querySelector<HTMLElement>(selector)!;
const occurrence = (eventId: string, resourceId?: string) =>
  [
    ...document.querySelectorAll<HTMLElement>(`[data-timeline-event][data-event-id="${eventId}"]`),
  ].filter(
    (candidate) => !resourceId || candidate.closest(`[data-resource-id="${resourceId}"]`),
  )[0];
const lane = (id: string) =>
  element(`[data-resource-id="${id}"] [data-timeline-lane]`).getBoundingClientRect();
const root = () => element("[data-timeline-root]");
const preview = () => document.querySelector<HTMLElement>("[data-timeline-preview]");
const status = () => element("[data-timeline-status]").textContent;

/** The screen position of an instant on a room's lane, in the middle of its row. */
const where = (resourceId: string, instant: string) => {
  const box = lane(resourceId);
  const row = element(`[data-resource-id="${resourceId}"]`).getBoundingClientRect();
  return {
    x: box.left + ((Date.parse(instant) - weekStart) / (7 * 24 * hour)) * box.width,
    y: row.top + row.height / 2,
  };
};

let pointerType = "mouse";
function fire(type: string, target: EventTarget, point: { x: number; y: number }) {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerId: 1,
      pointerType,
      isPrimary: true,
      button: 0,
      buttons: type === "pointerup" ? 0 : 1,
      clientX: point.x,
      clientY: point.y,
    }),
  );
}

/** Presses on an event and holds the pointer still long enough for the drag to begin. */
async function hold(target: Element, point: { x: number; y: number }) {
  fire("pointerdown", target, point);
  await sleep(holdTime);
}
async function moveTo(point: { x: number; y: number }) {
  fire("pointermove", document, point);
  await sleep(30);
}
async function release(point: { x: number; y: number }) {
  fire("pointerup", document, point);
  await sleep(60);
}
/** Presses Escape on the keyboard, as the viewer does, wherever the focus is. */
async function pressEscape() {
  await userEvent.keyboard("{Escape}");
  await sleep(30);
}

const handle = (eventId: string, edge: "start" | "end") =>
  element(
    `[data-timeline-event][data-event-id="${eventId}"] [data-timeline-resize-handle][data-edge="${edge}"]`,
  );
const centre = (target: Element) => {
  const box = target.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
};

describe("editing the front desk by pointer", () => {
  it("previews a move, snapped to the hour, and applies the proposal the board accepts", async () => {
    await mount();
    const original = occurrence("boiler")!.getBoundingClientRect();
    // The board is drawn where the test measures it: the boiler service starts at 08:00 on 28 October.
    expect(original.left).toBeCloseTo(where("room-102", "2026-10-28T08:00Z").x, 0);

    await hold(occurrence("boiler")!, where("room-102", "2026-10-28T12:00Z"));
    // A day and 20 minutes later, on Room 202, snaps to a day later.
    await moveTo(where("room-202", "2026-10-29T12:20Z"));

    expect(root().dataset.gesture).toBe("pointer");
    expect(root().dataset.operation).toBe("move");
    const hidden = occurrence("boiler", "room-102")!;
    expect(hidden.dataset.dragging).toBe("true");
    expect(getComputedStyle(hidden).opacity).toBe("0");
    expect(document.querySelectorAll("[data-timeline-preview]")).toHaveLength(1);
    expect(preview()!.closest("[data-resource-id]")!.getAttribute("data-resource-id")).toBe(
      "room-202",
    );
    expect(preview()!.dataset.status).toBe("allowed");
    expect(preview()!.getBoundingClientRect().left).toBeCloseTo(
      where("room-202", "2026-10-29T08:00Z").x,
      0,
    );
    expect(preview()!.getAttribute("aria-label")).toBe(
      "Move Boiler service to Room 202, Oct 29, 2026, 8:00 AM to Oct 29, 2026, 5:00 PM",
    );
    expect(status()).toBe(preview()!.getAttribute("aria-label"));
    expect(proposals).toEqual([]);

    await release(where("room-202", "2026-10-29T12:20Z"));

    expect(proposals).toHaveLength(1);
    expect(proposals[0]).toMatchObject({
      operation: "move",
      eventId: "boiler",
      sourceResourceId: "room-102",
      targetResourceId: "room-202",
      before: { start: "2026-10-28T08:00:00Z", end: "2026-10-28T17:00:00Z" },
      after: {
        start: "2026-10-29T08:00:00Z",
        end: "2026-10-29T17:00:00Z",
        resourceIds: ["room-202"],
      },
    });
    expect(root().dataset.gesture).toBeUndefined();
    expect(preview()).toBeNull();
    // The board accepted it, so the event is where it was proposed.
    await expect.poll(() => occurrence("boiler", "room-202")).toBeTruthy();
    expect(occurrence("boiler", "room-102")).toBeUndefined();
    expect(occurrence("boiler")!.getBoundingClientRect().left).toBeCloseTo(
      where("room-202", "2026-10-29T08:00Z").x,
      0,
    );
  });

  it("leaves the event where it was when the board does not accept the proposal", async () => {
    await mount({ acceptProposals: false });
    const original = occurrence("boiler")!.getBoundingClientRect();

    await hold(occurrence("boiler")!, where("room-102", "2026-10-28T12:00Z"));
    await moveTo(where("room-102", "2026-10-29T12:00Z"));
    await release(where("room-102", "2026-10-29T12:00Z"));

    expect(proposals).toHaveLength(1);
    await sleep(60);
    expect(occurrence("boiler")!.getBoundingClientRect().left).toBeCloseTo(original.left, 0);
    expect(occurrence("boiler")!.dataset.dragging).toBeUndefined();
    expect(preview()).toBeNull();
  });

  it("resizes an edge from its handle at once, with no hold, and proposes the new end", async () => {
    await mount();
    // Emma's stay began before the week, so only its end can be resized.
    expect(
      document.querySelector(
        '[data-event-id="emma"] [data-timeline-resize-handle][data-edge="start"]',
      ),
    ).toBeNull();

    const start = centre(handle("noah", "end"));
    fire("pointerdown", handle("noah", "end"), start);
    await sleep(30);
    expect(root().dataset.gesture).toBe("pointer");
    expect(root().dataset.operation).toBe("resize");

    // A day and a few minutes to the right, and off the row: the edge follows along the time axis.
    const day = lane("room-101").width / 7;
    const to = { x: start.x + day + 1, y: start.y + 200 };
    await moveTo(to);
    expect(preview()!.dataset.status).toBe("allowed");
    expect(preview()!.getAttribute("aria-label")).toBe(
      "Resize the end of Noah Tran on Room 101, Oct 27, 2026, 12:00 PM to Oct 31, 2026, 12:00 PM",
    );
    expect(preview()!.getBoundingClientRect().right).toBeCloseTo(
      where("room-101", "2026-10-31T12:00Z").x,
      0,
    );

    await release(to);

    expect(proposals).toHaveLength(1);
    expect(proposals[0]).toMatchObject({
      operation: "resize",
      edge: "end",
      eventId: "noah",
      after: { start: "2026-10-27T12:00:00Z", end: "2026-10-31T12:00:00Z" },
    });
    await expect
      .poll(() => occurrence("noah")!.getBoundingClientRect().right)
      .toBeCloseTo(where("room-101", "2026-10-31T12:00Z").x, 0);
  });

  it("proposes nothing for a destination a rule rejects, and says so", async () => {
    await mount();
    const original = occurrence("noah")!.getBoundingClientRect();

    // Two stays cannot share a room: Lena is in Room 201 from 29 October.
    await hold(occurrence("noah")!, where("room-101", "2026-10-28T12:00Z"));
    await moveTo(where("room-201", "2026-10-28T12:00Z"));

    expect(preview()!.dataset.status).toBe("rejected");
    expect(preview()!.dataset.rule).toBe("overlap");
    expect(preview()!.hasAttribute("data-not-allowed")).toBe(true);
    expect(preview()!.getAttribute("aria-label")).toMatch(
      /^Not allowed: Noah Tran on Room 201, .* \(overlaps another event\)$/,
    );

    await release(where("room-201", "2026-10-28T12:00Z"));

    expect(proposals).toEqual([]);
    expect(root().dataset.gesture).toBeUndefined();
    expect(root().dataset.cancelReason).toBe("rejected");
    expect(status()).toBe("Move cancelled: that destination is not allowed.");
    expect(preview()).toBeNull();
    expect(occurrence("noah", "room-101")!.getBoundingClientRect().left).toBeCloseTo(
      original.left,
      0,
    );
  });

  it("cancels a move on Escape, and proposes nothing when the pointer is then released", async () => {
    await mount();
    const original = occurrence("boiler")!.getBoundingClientRect();

    await hold(occurrence("boiler")!, where("room-102", "2026-10-28T12:00Z"));
    await moveTo(where("room-202", "2026-10-29T12:00Z"));
    expect(preview()).not.toBeNull();

    await pressEscape();

    expect(root().dataset.gesture).toBeUndefined();
    expect(root().dataset.cancelReason).toBe("escape");
    expect(status()).toBe("Move cancelled.");
    expect(preview()).toBeNull();
    expect(occurrence("boiler")!.dataset.dragging).toBeUndefined();

    await moveTo(where("room-202", "2026-10-30T12:00Z"));
    await release(where("room-202", "2026-10-30T12:00Z"));
    expect(proposals).toEqual([]);
    expect(preview()).toBeNull();
    expect(occurrence("boiler", "room-102")!.getBoundingClientRect().left).toBeCloseTo(
      original.left,
      0,
    );
  });

  it("moves by touch too, once the finger has been held", async () => {
    await mount();
    pointerType = "touch";

    await hold(occurrence("boiler")!, where("room-102", "2026-10-28T12:00Z"));
    await moveTo(where("room-102", "2026-10-28T15:00Z"));
    expect(root().dataset.gesture).toBe("pointer");
    expect(preview()!.getAttribute("aria-label")).toBe(
      "Move Boiler service to Room 102, Oct 28, 2026, 11:00 AM to Oct 28, 2026, 8:00 PM",
    );
    await release(where("room-102", "2026-10-28T15:00Z"));

    expect(proposals).toMatchObject([
      { after: { start: "2026-10-28T11:00:00Z", end: "2026-10-28T20:00:00Z" } },
    ]);
  });

  it("cancels a resize on Escape", async () => {
    await mount();

    const start = centre(handle("noah", "end"));
    fire("pointerdown", handle("noah", "end"), start);
    await moveTo({ x: where("room-101", "2026-10-31T12:00Z").x, y: start.y });
    expect(preview()).not.toBeNull();

    await pressEscape();
    expect(root().dataset.cancelReason).toBe("escape");
    expect(status()).toBe("Resize cancelled.");
    expect(preview()).toBeNull();

    await release({ x: where("room-101", "2026-10-31T12:00Z").x, y: start.y });
    expect(proposals).toEqual([]);
  });
});
