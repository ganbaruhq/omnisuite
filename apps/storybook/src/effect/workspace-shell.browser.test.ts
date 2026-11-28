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
let failures: string[];
const toggle = () => container.querySelector<HTMLButtonElement>('[data-slot="sidebar-trigger"]')!;
const sidebar = () => container.querySelector<HTMLElement>('[data-slot="sidebar"]');
const desktopPanel = () => container.querySelector<HTMLElement>('[data-slot="sidebar-container"]');
const mobileDialog = () => sidebar()?.closest("dialog") ?? null;
const action = (name: string) =>
  [...container.querySelectorAll<HTMLButtonElement>('[role="toolbar"] button')].find(
    (button) => button.textContent === name,
  )!;
const settle = (element: HTMLElement) =>
  Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished));

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
  await expect.poll(toggle).toBeTruthy();
});
afterEach(async () => {
  root?.unmount();
  container.remove();
  await page.viewport(414, 896);
  vi.restoreAllMocks();
  expect(failures).toEqual([]);
});

it("matches the React shell dimensions and collapses without remounting page state", async () => {
  await expect.poll(() => desktopPanel()?.getBoundingClientRect().width).toBe(224);
  const inset = container.querySelector<HTMLElement>('[data-slot="sidebar-inset"]')!;
  expect(inset.getBoundingClientRect().left).toBe(224);
  expect(container.querySelector('[data-slot="avatar-fallback"]')?.textContent).toBe("AL");
  const avatar = container.querySelector<HTMLElement>('[data-slot="avatar"]')!;
  expect(avatar.getBoundingClientRect().width).toBe(32);
  const toolbar = container.querySelector<HTMLElement>('[data-slot="toolbar"]')!;
  expect(toolbar.getBoundingClientRect().height).toBe(36);
  const search = container.querySelector<HTMLInputElement>("#collection-search")!;
  await userEvent.fill(search, "Design");
  await userEvent.click(toggle());
  await expect.poll(() => sidebar()?.dataset.state).toBe("collapsed");
  await expect.poll(() => inset.getBoundingClientRect().left).toBe(0);
  await expect.poll(() => desktopPanel()?.hasAttribute("inert")).toBe(false);
  expect(desktopPanel()!.getBoundingClientRect().right).toBeLessThanOrEqual(0);
  expect(getComputedStyle(desktopPanel()!).visibility).toBe("hidden");
  expect(search.value).toBe("Design");
  expect(container.querySelector("#collection-search")).toBe(search);
  await userEvent.keyboard("{Control>}b{/Control}");
  await expect.poll(() => sidebar()?.dataset.state).toBe("expanded");
  await expect.poll(() => inset.getBoundingClientRect().left).toBe(224);
});

it("opens navigation as a mobile Sheet, traps focus and restores it on close", async () => {
  const search = container.querySelector<HTMLInputElement>("#collection-search")!;
  await userEvent.fill(search, "Design");
  await page.viewport(414, 896);
  await expect.poll(() => desktopPanel()).toBeNull();
  await userEvent.click(toggle());
  await expect.poll(() => mobileDialog()?.matches(":popover-open")).toBe(true);
  await expect.poll(() => sidebar()?.contains(document.activeElement)).toBe(true);
  await settle(sidebar()!);
  expect(sidebar()!.dataset.mobile).toBe("true");
  // A top-layer dialog named by the sheet's title; the tabbing below shows it holds focus.
  const titleId = mobileDialog()!.getAttribute("aria-labelledby")!;
  expect(document.getElementById(titleId)?.textContent).toBe("Sidebar");
  expect(sidebar()!.dataset.side).toBe("left");
  await expect.poll(() => sidebar()!.getBoundingClientRect().left).toBe(0);
  const bounds = sidebar()!.getBoundingClientRect();
  // React's sheet width, `data-[side=left]:w-3/4`, outranks the 18rem `--sidebar-width`.
  expect(bounds.width).toBe(window.innerWidth * 0.75);
  expect(bounds.height).toBe(window.innerHeight);
  for (let i = 0; i < 7; i++) {
    await userEvent.tab();
    expect(sidebar()!.contains(document.activeElement)).toBe(true);
  }
  await userEvent.keyboard("{Escape}");
  await expect.poll(mobileDialog).toBeNull();
  expect(document.activeElement).toBe(toggle());
  await userEvent.keyboard("{Enter}");
  await expect.poll(() => mobileDialog()?.matches(":popover-open")).toBe(true);
  await page.viewport(1280, 900);
  await expect.poll(() => desktopPanel()).not.toBeNull();
  expect(mobileDialog()).toBeNull();
  expect(container.querySelector("#collection-search")).toBe(search);
  expect(search.value).toBe("Design");
});

it("uses the kit's toolbar arrows, Home/End and disabled-item handling", async () => {
  const refresh = action("Refresh");
  const help = action("Help");
  const archive = action("Archive");
  expect(archive.disabled).toBe(true);
  refresh.focus();
  await userEvent.keyboard("{ArrowRight}");
  await expect.poll(() => document.activeElement).toBe(help);
  await userEvent.keyboard("{ArrowRight}");
  await expect.poll(() => document.activeElement).toBe(refresh);
  await userEvent.keyboard("{End}");
  await expect.poll(() => document.activeElement).toBe(help);
  await userEvent.keyboard("{Home}");
  await expect.poll(() => document.activeElement).toBe(refresh);
  await userEvent.keyboard("{Enter}");
  await expect
    .poll(() => container.querySelector("[data-workspace-status]")?.textContent)
    .toBe("Workspace refreshed 1 time.");
});
