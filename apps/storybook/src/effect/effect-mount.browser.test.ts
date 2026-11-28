import { composeStories } from "@storybook/react-vite";
import { createElement, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vite-plus/test";
import { flatTimeline } from "@omnisuite/calendar-sample-data/sample-timeline";
import { createWindowQueries } from "@omnisuite/calendar-sample-data/window-queries";
import type { SampleEvent } from "./calendar/front-desk";
import * as stories from "./front-desk.stories";

const { Light } = composeStories(stories);

it("disposes pending observations and DOM when React unmounts, including StrictMode replay", async () => {
  const signals: AbortSignal[] = [];
  const queries = createWindowQueries((_window, signal) => {
    signals.push(signal);
    return new Promise<readonly SampleEvent[]>(() => {});
  });
  const container = document.body.appendChild(document.createElement("div"));
  const root = createRoot(container);
  try {
    root.render(
      createElement(
        StrictMode,
        {},
        createElement(() =>
          Light({
            boardProps: { input: flatTimeline, queries },
          }),
        ),
      ),
    );
    await expect.poll(() => container.querySelectorAll("[data-timeline-root]").length).toBe(1);
    await expect.poll(() => signals.some((signal) => !signal.aborted)).toBe(true);
  } finally {
    root.unmount();
    container.remove();
  }
  await expect.poll(() => signals.every((signal) => signal.aborted)).toBe(true);
  expect(container.childElementCount).toBe(0);
});
