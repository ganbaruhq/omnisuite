import { composeStories } from "@storybook/react-vite";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";
import * as stories from "./workspace.stories";
const { Default } = composeStories(stories);
import "../styles.css";

// The example app, mounted the way `main.ts` mounts it, checked for what only a real browser
// shows: the top layer, focus moving in and out of the dialog, where popups land, and the toast.

let root: Root | undefined;
let container: HTMLElement | undefined;
// A component that fails is only logged, and blanks its part of the page, so every test also
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
  container = document.body.appendChild(document.createElement("div"));
  root = createRoot(container);
  root.render(createElement(Default));
  await expect.poll(() => newCollection()).toBeTruthy();
});

afterEach(async () => {
  root?.unmount();
  container?.remove();
  root = undefined;
  container = undefined;
  await page.viewport(414, 896);
  vi.restoreAllMocks();
  expect(logged.filter((line) => / failed /.test(line))).toEqual([]);
});

const newCollection = () =>
  [...document.querySelectorAll<HTMLButtonElement>("button")].find(
    (button) => button.textContent?.trim() === "New collection",
  );
const trigger = () => newCollection()!;
const dialog = () => document.querySelector<HTMLDialogElement>("dialog");
const popup = () => document.querySelector<HTMLElement>('[data-slot="dialog-content"]');
const isOpenOnTopLayer = (element: Element | null | undefined) =>
  element != null && element.matches(":popover-open, :modal");
const buttonNamed = (name: string) =>
  [...(popup()?.querySelectorAll<HTMLButtonElement>("button") ?? [])].find(
    (button) => button.textContent?.trim() === name,
  )!;
const nameInput = () =>
  popup()!.querySelector<HTMLInputElement>('input[placeholder="Design system"]')!;

async function openDialog() {
  await userEvent.click(trigger());
  await expect.poll(() => isOpenOnTopLayer(dialog())).toBe(true);
  await expect.poll(() => popup()?.contains(document.activeElement)).toBe(true);
}

/** The gap between two boxes along the axis they are stacked on, or `Infinity` if they overlap. */
function gapBetween(a: DOMRect, b: DOMRect) {
  if (a.bottom <= b.top) return b.top - a.bottom;
  if (b.bottom <= a.top) return a.top - b.bottom;
  if (a.right <= b.left) return b.left - a.right;
  if (b.right <= a.left) return a.left - b.right;
  return Infinity;
}

const overlapsHorizontally = (a: DOMRect, b: DOMRect) => a.left < b.right && b.left < a.right;

describe("the new collection dialog", () => {
  it("opens on the top layer and moves focus into its popup", async () => {
    expect(dialog()?.matches(":popover-open")).not.toBe(true);
    // The tooltip opens on the way to the click and re-renders the trigger on its own.
    await userEvent.hover(trigger());

    await openDialog();

    // A `<dialog>`, named by its title, that the trigger says it opened.
    const title = document.getElementById(dialog()!.getAttribute("aria-labelledby") ?? "");
    expect(title?.textContent).toBe("New collection");
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(trigger().getAttribute("aria-controls")).toBe(dialog()!.id);
  });

  it("keeps focus inside while it is open", async () => {
    await openDialog();

    // More presses than the popup has tabbable elements, in both directions.
    for (let press = 0; press < 12; press++) {
      await userEvent.keyboard("{Tab}");
      expect(popup()!.contains(document.activeElement)).toBe(true);
    }
    for (let press = 0; press < 12; press++) {
      await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
      expect(popup()!.contains(document.activeElement)).toBe(true);
    }
  });

  it("closes on Escape and gives focus back to the trigger", async () => {
    await openDialog();

    await userEvent.keyboard("{Escape}");

    await expect.poll(() => isOpenOnTopLayer(dialog())).toBe(false);
    await expect.poll(() => document.activeElement).toBe(trigger());
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
  });

  it("gives focus back to the trigger when Cancel closes it", async () => {
    await openDialog();

    await userEvent.click(buttonNamed("Cancel"));

    await expect.poll(() => isOpenOnTopLayer(dialog())).toBe(false);
    await expect.poll(() => document.activeElement).toBe(trigger());
  });
});

describe("the form", () => {
  it("draws every field, each control described by its description", async () => {
    await openDialog();

    const fields = [...popup()!.querySelectorAll<HTMLElement>('[data-slot="field"]')];
    expect(fields).toHaveLength(5);
    for (const description of popup()!.querySelectorAll<HTMLElement>(
      '[data-slot="field-description"]',
    )) {
      const field = description.closest<HTMLElement>('[data-slot="field"]')!;
      const control = field.querySelector<HTMLElement>("input, textarea, button")!;
      expect(control.getAttribute("aria-describedby")?.split(" ")).toContain(description.id);
    }
  });

  it("shows the name's error through its field when submitted empty, and stays open", async () => {
    await openDialog();

    await userEvent.click(buttonNamed("Create"));

    const input = nameInput();
    await expect.poll(() => input.getAttribute("aria-invalid")).toBe("true");
    const error = popup()!.querySelector<HTMLElement>('[data-slot="field-error"]');
    expect(error?.textContent).toContain("Give the collection a name");
    // The control is described by its error, so a screen reader reads it.
    const describedBy = input.getAttribute("aria-describedby")?.split(" ") ?? [];
    expect(error?.id).toBeTruthy();
    expect(describedBy).toContain(error!.id);
    expect(isOpenOnTopLayer(dialog())).toBe(true);
    expect(document.querySelector('[data-slot="toast"]')).toBeNull();
  });

  it("clears the error once the name is valid", async () => {
    await openDialog();
    await userEvent.click(buttonNamed("Create"));
    await expect.poll(() => nameInput().getAttribute("aria-invalid")).toBe("true");

    await userEvent.type(nameInput(), "Design system");

    await expect.poll(() => nameInput().getAttribute("aria-invalid")).not.toBe("true");
    expect(popup()!.querySelector('[data-slot="field-error"]')).toBeNull();
  });

  it("submits when valid: the dialog closes and a toast says the collection was created", async () => {
    await openDialog();

    await userEvent.type(nameInput(), "Design system");
    await userEvent.click(buttonNamed("Create"));

    await expect.poll(() => isOpenOnTopLayer(dialog())).toBe(false);
    const toast = await expect
      .poll(() => document.querySelector<HTMLElement>('[data-slot="toast"]'))
      .toBeTruthy()
      .then(() => document.querySelector<HTMLElement>('[data-slot="toast"]')!);
    expect(toast.textContent).toContain("Collection created");
    expect(toast.textContent).toContain("“Design system” is visible to my team.");
    // The toaster is a popover, so the toast shows over the page.
    expect(isOpenOnTopLayer(document.querySelector('[data-slot="toast-viewport"]'))).toBe(true);
    expect(toast.getBoundingClientRect().height).toBeGreaterThan(0);
    expect(document.body.textContent).toContain("1 created in this session.");
  });
});

describe("the tooltip", () => {
  it("opens beside its trigger on the top layer", async () => {
    await userEvent.hover(trigger());

    const positioner = () =>
      document.querySelector<HTMLElement>('[data-slot="tooltip-positioner"]');
    await expect.poll(() => isOpenOnTopLayer(positioner())).toBe(true);
    const content = document.querySelector<HTMLElement>('[data-slot="tooltip-content"]')!;
    expect(content.textContent).toContain("Group pages under one name");

    await expect
      .poll(() => gapBetween(trigger().getBoundingClientRect(), content.getBoundingClientRect()))
      .toBeLessThanOrEqual(12);
    expect(
      overlapsHorizontally(trigger().getBoundingClientRect(), content.getBoundingClientRect()),
    ).toBe(true);

    // The arrow's middle sits just inside the popup's edge toward the trigger, as in React.
    await expect.poll(() => content.getAnimations().length).toBe(0);
    const arrow = document
      .querySelector<HTMLElement>('[data-slot="tooltip-arrow"]')!
      .getBoundingClientRect();
    const box = content.getBoundingClientRect();
    expect(box.bottom - (arrow.top + arrow.height / 2)).toBeCloseTo(2, 0);

    await userEvent.unhover(trigger());
    await expect.poll(() => isOpenOnTopLayer(positioner())).toBe(false);
  });
});

describe("the visibility select", () => {
  it("opens its popup beside the trigger on the top layer, and picks an option", async () => {
    await openDialog();
    const selectTrigger = popup()!.querySelector<HTMLButtonElement>(
      '[data-slot="select-trigger"]',
    )!;
    expect(selectTrigger.textContent).toContain("My team");

    await userEvent.click(selectTrigger);

    const positioner = () => document.querySelector<HTMLElement>('[data-slot="select-positioner"]');
    await expect.poll(() => isOpenOnTopLayer(positioner())).toBe(true);
    const content = document.querySelector<HTMLElement>('[data-slot="select-content"]')!;
    // As in React, the popup lines the selected option up with the trigger's value.
    const selected = () =>
      [...content.querySelectorAll<HTMLElement>('[role="option"]')].find(
        (option) => option.getAttribute("aria-selected") === "true",
      )!;
    const centreOf = (rect: DOMRect) => rect.top + rect.height / 2;
    await expect
      .poll(() =>
        Math.abs(
          centreOf(selected().getBoundingClientRect()) -
            centreOf(selectTrigger.getBoundingClientRect()),
        ),
      )
      .toBeLessThanOrEqual(4);
    expect(selected().textContent).toContain("My team");
    expect(
      overlapsHorizontally(selectTrigger.getBoundingClientRect(), content.getBoundingClientRect()),
    ).toBe(true);

    const everyone = [...content.querySelectorAll<HTMLElement>('[role="option"]')].find((option) =>
      option.textContent?.includes("Everyone"),
    )!;
    await userEvent.click(everyone);

    await expect.poll(() => isOpenOnTopLayer(positioner())).toBe(false);
    expect(selectTrigger.textContent).toContain("Everyone");
    // Picking closes only the select: the dialog stays open around it.
    expect(isOpenOnTopLayer(dialog())).toBe(true);
  });
});
