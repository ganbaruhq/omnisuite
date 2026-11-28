import { composeStories } from "@storybook/react-vite";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";
import * as stories from "./workspace.stories";
const { Default } = composeStories(stories);
import "../styles.css";

let root: Root | undefined;
let container: HTMLElement;
let failures: string[] = [];
beforeEach(async () => {
  failures = [];
  for (const method of ["log", "warn", "error"] as const) {
    const original = console[method].bind(console);
    vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
      const line = args.map(String).join(" ");
      if (/ failed /.test(line)) failures.push(line);
      original(...args);
    });
  }
  await page.viewport(1280, 900);
  container = document.body.appendChild(document.createElement("div"));
  root = createRoot(container);
  root.render(createElement(Default));
  await expect
    .poll(() => container.querySelector("#collection-detail h1")?.textContent)
    .toBe("Design system");
});
afterEach(async () => {
  root?.unmount();
  container.remove();
  await page.viewport(414, 896);
  vi.restoreAllMocks();
  expect(failures).toEqual([]);
});
it("composes every markup component with semantic breadcrumbs and styled separators", async () => {
  for (const slot of [
    "card",
    "badge",
    "breadcrumb",
    "kbd",
    "separator",
    "skeleton",
    "text",
    "page",
    "empty",
    "tag",
    "status-dot",
    "input-group",
    "button-group",
    "layer-card",
  ])
    expect(container.querySelector(`[data-slot=${slot}]`), slot).not.toBeNull();
  expect(container.querySelector("[aria-current=page]")?.textContent).toBe("Design system");
  const horizontal = container.querySelector<HTMLElement>(
    "[data-slot=separator][data-orientation=horizontal]",
  )!;
  expect(horizontal.getBoundingClientRect().height).toBe(1);
  const vertical = container.querySelector<HTMLElement>("[data-slot=button-group-separator]")!;
  expect(vertical.getBoundingClientRect().width).toBe(1);
  expect(vertical.getBoundingClientRect().height).toBeGreaterThan(10);
  const archive = container.querySelector<HTMLButtonElement>(
    "#collection-detail [data-slot=button-group] button",
  )!;
  await userEvent.click(archive);
  await expect
    .poll(() => container.querySelector("#collection-detail [data-slot=badge]")?.textContent)
    .toBe("Archived");
});
it("filters collection pages and keeps the detail layout within a mobile viewport", async () => {
  await page.viewport(414, 896);
  const search = container.querySelector<HTMLInputElement>('input[aria-label="Filter pages"]')!;
  await userEvent.fill(search, "not-present");
  await expect
    .poll(() => container.querySelector("[data-slot=empty-title]")?.textContent)
    .toBe("No matching pages");
  expect(container.querySelector("[data-page-link]")).toBeNull();
  await userEvent.fill(search, "Tokens");
  await expect
    .poll(() => container.querySelector("[data-page-link] [data-variant=heading]")?.textContent)
    .toBe("Tokens");
  expect(container.scrollWidth).toBeLessThanOrEqual(414);
});
