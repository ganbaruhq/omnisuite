import { composeStories } from "@storybook/react-vite";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";
import * as stories from "./choice-controls.stories";
const { Light } = composeStories(stories);
import "../styles.css";

let root: Root | undefined;
let container: HTMLElement;
let failures: Array<string>;
beforeEach(async () => {
  failures = [];
  for (const method of ["log", "warn", "error"] as const) {
    const original = console[method].bind(console);
    vi.spyOn(console, method).mockImplementation((...args: Array<unknown>) => {
      const line = args.map(String).join(" ");
      if (/ failed /.test(line)) failures.push(line);
      original(...args);
    });
  }
  await page.viewport(1280, 900);
  container = document.body.appendChild(document.createElement("div"));
  root = createRoot(container);
  root.render(createElement(Light));
  await expect.element(page.getByRole("button", { name: "Save preferences" })).toBeVisible();
});
afterEach(async () => {
  root?.unmount();
  container.remove();
  vi.restoreAllMocks();
  expect(failures).toEqual([]);
});

it("Combobox opens on the top layer, highlights by keyboard and selects an owner", async () => {
  const input = page.getByRole("combobox", { name: "Owner", exact: true });
  await userEvent.click(input);
  const positioner = () =>
    container.querySelector<HTMLElement>('[data-slot="combobox-positioner"]');
  await expect.poll(() => positioner()?.matches(":popover-open")).toBe(true);
  await userEvent.keyboard("{ArrowDown}");
  await expect.poll(() => input.element().getAttribute("aria-activedescendant")).toBeTruthy();
  const highlighted = () =>
    container.querySelector<HTMLElement>('[role="option"][data-highlighted]');
  await expect.poll(() => highlighted()?.textContent?.trim()).toBe("Design");
  const style = getComputedStyle(highlighted()!);
  expect(style.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  await userEvent.keyboard("{ArrowDown}{Enter}");
  await expect.element(input).toHaveValue("Engineering");
  await expect.poll(() => positioner()?.matches(":popover-open") ?? false).toBe(false);
  const popup = container.querySelector<HTMLElement>('[data-slot="combobox-content"]');
  expect(popup === null || popup.getBoundingClientRect().height === 0).toBe(true);
});

it("all six controls validate through Field, clear their errors and submit", async () => {
  await userEvent.click(page.getByRole("button", { name: "Save preferences" }));
  await expect.poll(() => container.querySelectorAll('[data-slot="field-error"]').length).toBe(6);
  for (const error of container.querySelectorAll('[data-slot="field-error"]')) {
    const field = error.closest('[data-slot="field"]')!;
    expect(field.hasAttribute("data-invalid")).toBe(true);
    const control = field.querySelector("[aria-describedby]")!;
    expect(control.getAttribute("aria-describedby")?.split(" ")).toContain(error.id);
  }
  await userEvent.click(page.getByRole("radio", { name: "Team", exact: true }));
  const slider = page.getByRole("slider", { name: "Capacity", exact: true });
  await userEvent.keyboard("{Tab}");
  expect(document.activeElement).toBe(slider.element());
  await userEvent.keyboard("{Home}{ArrowRight}");
  await userEvent.click(page.getByRole("button", { name: "Enable sharing", exact: true }));
  await userEvent.click(page.getByRole("button", { name: "List", exact: true }));
  await userEvent.click(page.getByRole("combobox", { name: "Owner", exact: true }));
  await userEvent.keyboard("{ArrowDown}{Enter}");
  await userEvent.type(
    page.getByRole("textbox", { name: "Verification code 1 of 6", exact: true }),
    "123456",
  );
  await expect.poll(() => container.querySelectorAll('[data-slot="field-error"]').length).toBe(0);
  await userEvent.click(page.getByRole("button", { name: "Save preferences" }));
  await expect
    .element(page.getByRole("status", { name: "Preferences status" }))
    .toHaveTextContent("Preferences saved");
});

it("Slider positions its thumb and range for pointer and keyboard changes", async () => {
  const control = container.querySelector<HTMLElement>('[data-slot="slider-control"]')!;
  await userEvent.click(control);
  const input = page.getByRole("slider", { name: "Capacity", exact: true });
  await expect.poll(() => Number(input.element().getAttribute("aria-valuenow"))).toBe(50);
  const track = container.querySelector<HTMLElement>('[data-slot="slider-track"]')!;
  const thumb = container.querySelector<HTMLElement>('[data-slot="slider-thumb"]')!;
  const range = container.querySelector<HTMLElement>('[data-slot="slider-range"]')!;
  const centre = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    return rect.left + rect.width / 2;
  };
  expect(Math.abs(centre(thumb) - centre(track))).toBeLessThan(2);
  expect(range.getBoundingClientRect().width).toBeCloseTo(
    track.getBoundingClientRect().width / 2,
    0,
  );
  input.element().focus();
  await userEvent.keyboard("{End}");
  await expect.poll(() => input.element().getAttribute("aria-valuenow")).toBe("100");
  expect(Math.abs(centre(thumb) - track.getBoundingClientRect().right)).toBeLessThan(2);
  await userEvent.keyboard("{Home}");
  await expect.poll(() => input.element().getAttribute("aria-valuenow")).toBe("0");
  expect(Math.abs(centre(thumb) - track.getBoundingClientRect().left)).toBeLessThan(2);
});

it("Combobox filters to an empty state and clears the selected value", async () => {
  const input = page.getByRole("combobox", { name: "Owner", exact: true });
  await userEvent.type(input, "Nobody");
  await expect.element(page.getByText("No results found.", { exact: true })).toBeVisible();
  await userEvent.clear(input);
  await userEvent.keyboard("{ArrowDown}{Enter}");
  await expect.element(input).toHaveValue("Design");
  await userEvent.click(page.getByRole("button", { name: "Clear Owner", exact: true }));
  await expect.element(input).toHaveValue("");
  await userEvent.click(page.getByRole("button", { name: "Save preferences" }));
  await expect.element(page.getByText("Choose an owner", { exact: true })).toBeVisible();
});
