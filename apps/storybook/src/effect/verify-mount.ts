import { expect, waitFor } from "storybook/test";

/** BrowserHost starts in a React effect; a successful React render alone is not sufficient. */
export async function verifyMount({ canvasElement }: { readonly canvasElement: HTMLElement }) {
  await waitFor(() => {
    expect(canvasElement.querySelector("[data-effect-story]")?.childElementCount).toBeGreaterThan(
      0,
    );
  });
}
