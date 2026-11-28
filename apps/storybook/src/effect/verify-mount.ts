import { expect, waitFor } from "storybook/test";

/** BrowserHost starts in a React effect; a successful React render alone is not sufficient. */
export async function verifyMount({
  canvasElement,
  globals,
}: {
  readonly canvasElement: HTMLElement;
  readonly globals: { readonly theme?: string };
}) {
  await waitFor(() => {
    expect(canvasElement.querySelector("[data-effect-story]")?.childElementCount).toBeGreaterThan(
      0,
    );
    expect(document.documentElement.classList.contains("dark")).toBe(globals.theme === "dark");
  });
}
