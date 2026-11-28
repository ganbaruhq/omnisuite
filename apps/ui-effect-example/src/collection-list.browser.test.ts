import { BrowserHost } from "@effect/ui/html";
import { Effect, Fiber, Layer } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";
import { App } from "./app";
import "./styles.css";

// The collection list in the example app, checked for what only a real browser shows: the
// top layer when overlays open inside each other, Escape closing only the top one, focus going
// back to the trigger, the sheet sliding in from its edge, and a swipe closing it.

let fiber: Fiber.Fiber<never> | undefined;
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
  fiber = Effect.runFork(Layer.launch(BrowserHost.mount(App, {}, container)));
  await expect.poll(() => filtersTrigger()).toBeTruthy();
});

afterEach(async () => {
  vi.restoreAllMocks();
  if (fiber !== undefined) await Effect.runPromise(Fiber.interrupt(fiber));
  container?.remove();
  fiber = undefined;
  container = undefined;
  await page.viewport(414, 896);
  expect(logged.filter((line) => / failed /.test(line))).toEqual([]);
});

const list = () => document.querySelector('section[aria-labelledby="your-collections"]')!;
const buttons = (root: ParentNode = document) => [
  ...root.querySelectorAll<HTMLButtonElement>("button"),
];
const filtersTrigger = () =>
  list()
    ? buttons(list()).find((button) => button.getAttribute("data-slot") === "sheet-trigger")
    : undefined;
const rowTrigger = (name: string) =>
  list().querySelector<HTMLButtonElement>(`button[aria-label="Actions for ${name}"]`)!;
const sortTrigger = () => buttons().find((button) => button.textContent?.startsWith("Sort by"))!;
const helpTrigger = () =>
  buttons().find((button) => button.textContent?.trim() === "How do filters work?")!;

const isOpenOnTopLayer = (element: Element | null | undefined) =>
  element != null && element.matches(":popover-open, :modal");
/** The top-layer element `element` is drawn in: its own popover, or the modal it is in. */
const layerOf = (element: Element | null) => element?.closest(":popover-open, :modal") ?? null;
const sheet = () => document.querySelector<HTMLElement>('[data-slot="sheet-content"]');
const sheetDialog = () => sheet()?.closest("dialog") ?? null;
// Closed submenus keep their positioner, so the open menu is the one on the top layer.
const openMenu = () =>
  [...document.querySelectorAll<HTMLElement>('[data-slot="dropdown-menu-positioner"]')]
    .find(isOpenOnTopLayer)
    ?.querySelector<HTMLElement>('[data-slot="dropdown-menu-content"]') ?? null;
const helpPopup = () => document.querySelector<HTMLElement>('[data-slot="popover-content"]');
const menuItem = (name: string) =>
  [...(openMenu()?.querySelectorAll<HTMLElement>("[role^=menuitem]") ?? [])].find(
    (item) => item.textContent?.trim() === name,
  )!;
const highlighted = () =>
  openMenu()?.querySelector("[data-highlighted]")?.textContent?.trim() ?? null;
const rowNames = () =>
  [...list().querySelectorAll<HTMLElement>("li[data-row]")].map(
    (row) => row.querySelector("span")?.firstChild?.textContent,
  );
const status = () => list().querySelector('[role="status"]')?.textContent ?? "";

/** Whether `element` is what a press on its center lands on: nothing on the top layer covers it. */
const isOnTop = (element: HTMLElement | null) => {
  if (element === null) return false;
  const box = element.getBoundingClientRect();
  return element.contains(
    document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2),
  );
};

/** Waits for the transitions running on `element` and its descendants. */
const settled = (element: HTMLElement) =>
  Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished));

async function openFilters() {
  await userEvent.click(filtersTrigger()!);
  await expect.poll(() => isOpenOnTopLayer(sheetDialog())).toBe(true);
  await expect.poll(() => sheet()?.contains(document.activeElement)).toBe(true);
  await settled(sheet()!);
}

describe("the action menu on each row", () => {
  it("moves with the kit's keys and typeahead, and doesn't pick a disabled item", async () => {
    rowTrigger("Design system").focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(() => isOpenOnTopLayer(openMenu()?.parentElement)).toBe(true);
    await expect.poll(highlighted).toBe("Rename");
    expect(openMenu()!.contains(document.activeElement)).toBe(true);

    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(highlighted).toBe("Duplicate");
    // Typeahead goes to the next item whose label starts with what's typed.
    await userEvent.keyboard("r");
    await expect.poll(highlighted).toBe("Rename");

    // The locked collection's Delete can be reached but not picked.
    await userEvent.keyboard("{End}");
    await expect.poll(highlighted).toBe("Delete");
    expect(menuItem("Delete").getAttribute("aria-disabled")).toBe("true");
    await userEvent.keyboard("{Enter}");
    // `force`, as a disabled item isn't one Playwright clicks on its own.
    await userEvent.click(menuItem("Delete"), { force: true });
    expect(isOpenOnTopLayer(openMenu()?.parentElement)).toBe(true);
    expect(rowNames()).toContain("Design system");
    expect(status()).toBe("");

    // Escape closes the menu and gives focus back to its trigger.
    await userEvent.keyboard("{Escape}");
    await expect.poll(() => openMenu()).toBeNull();
    expect(document.activeElement).toBe(rowTrigger("Design system"));
  });

  it("acts on its own row", async () => {
    await userEvent.click(rowTrigger("Research notes"));
    await expect.poll(highlighted).toBe(null);
    await userEvent.click(menuItem("Delete"));

    await expect.poll(rowNames).toEqual(["Design system", "Launch plan"]);
    expect(status()).toBe("Deleted “Research notes”.");
    await expect.poll(() => openMenu()).toBeNull();

    // A menu is drawn against its own trigger, on the row it belongs to: below it, or above it
    // when the window has no room below.
    await userEvent.click(rowTrigger("Launch plan"));
    await expect.poll(() => openMenu()).not.toBeNull();
    await settled(openMenu()!);
    const menu = openMenu()!.getBoundingClientRect();
    const trigger = rowTrigger("Launch plan").getBoundingClientRect();
    const gap = menu.top >= trigger.bottom ? menu.top - trigger.bottom : trigger.top - menu.bottom;
    expect(gap).toBeGreaterThanOrEqual(0);
    expect(gap).toBeLessThan(12);
    expect(menu.left).toBeLessThan(trigger.right);
    await userEvent.click(menuItem("Duplicate"));
    await expect.poll(rowNames).toEqual(["Design system", "Launch plan", "Launch plan copy"]);
  });
});

describe("the filter sheet", () => {
  it("slides in from the right edge, over the page", async () => {
    await userEvent.click(filtersTrigger()!);
    await expect.poll(() => sheet()).not.toBeNull();
    // It slides: a transition moves it in from off the edge.
    const sliding = () =>
      sheet()!
        .getAnimations()
        .some(
          (animation) =>
            animation instanceof CSSTransition &&
            (animation.transitionProperty === "translate" ||
              animation.transitionProperty === "transform"),
        );
    await expect.poll(sliding).toBe(true);
    await settled(sheet()!);

    const box = sheet()!.getBoundingClientRect();
    expect(box.right).toBe(window.innerWidth);
    expect(box.top).toBe(0);
    expect(box.height).toBe(window.innerHeight);
    expect(sheet()!.getAttribute("data-side")).toBe("right");
    expect(isOpenOnTopLayer(sheetDialog())).toBe(true);
    expect(isOnTop(sheet())).toBe(true);
  });

  it("stacks a menu and a popover over it, and Escape closes the top one first", async () => {
    await openFilters();

    // The sort menu opens on top of the sheet.
    await userEvent.click(sortTrigger());
    await expect.poll(() => openMenu()).not.toBeNull();
    await settled(openMenu()!);
    expect(isOpenOnTopLayer(sheetDialog())).toBe(true);
    expect(isOnTop(openMenu())).toBe(true);

    // Escape closes the menu only, and focus goes back to its trigger in the sheet.
    await userEvent.keyboard("{Escape}");
    await expect.poll(() => openMenu()).toBeNull();
    expect(isOpenOnTopLayer(sheetDialog())).toBe(true);
    expect(document.activeElement).toBe(sortTrigger());

    // A radio item picks without closing the menu, as in React; Escape still closes only it.
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(highlighted).toBe("Name");
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await expect.poll(() => sortTrigger().textContent).toBe("Sort by: Last updated");
    expect(rowNames()).toEqual(["Research notes", "Design system", "Launch plan"]);
    expect(openMenu()).not.toBeNull();
    await userEvent.keyboard("{Escape}");
    await expect.poll(() => openMenu()).toBeNull();
    expect(isOpenOnTopLayer(sheetDialog())).toBe(true);
    expect(document.activeElement).toBe(sortTrigger());

    // The help popover opens on top of the sheet too.
    await userEvent.click(helpTrigger());
    await expect.poll(() => layerOf(helpPopup())).not.toBe(null);
    expect(layerOf(helpPopup())).not.toBe(sheetDialog());
    await settled(helpPopup()!);
    expect(isOnTop(helpPopup())).toBe(true);
    await userEvent.keyboard("{Escape}");
    await expect.poll(() => helpPopup()).toBeNull();
    expect(isOpenOnTopLayer(sheetDialog())).toBe(true);
    expect(document.activeElement).toBe(helpTrigger());

    // The next Escape closes the sheet, and focus goes back to its trigger.
    await userEvent.keyboard("{Escape}");
    await expect.poll(() => sheet()).toBeNull();
    expect(document.activeElement).toBe(filtersTrigger());
  });

  it("closes when swiped toward its edge, following the pointer", async () => {
    await openFilters();
    const popup = sheet()!;
    const start = popup.getBoundingClientRect();
    const y = start.top + 40;
    const at = (x: number, buttons: number) => ({
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerId: 7,
      pointerType: "mouse",
      isPrimary: true,
      button: 0,
      buttons,
      clientX: x,
      clientY: y,
    });
    const header = popup.querySelector<HTMLElement>('[data-slot="sheet-header"]')!;
    header.dispatchEvent(new PointerEvent("pointerdown", at(start.left + 20, 1)));
    for (let step = 1; step <= 8; step++) {
      document.dispatchEvent(new PointerEvent("pointermove", at(start.left + 20 + step * 30, 1)));
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }

    // While the swipe runs the sheet follows the pointer.
    await expect.poll(() => popup.getBoundingClientRect().left).toBeGreaterThan(start.left + 100);
    expect(popup.hasAttribute("data-swiping")).toBe(true);

    document.dispatchEvent(new PointerEvent("pointerup", at(start.left + 260, 0)));
    await expect.poll(() => sheet()).toBeNull();
    expect(document.activeElement).toBe(filtersTrigger());
  });
});
