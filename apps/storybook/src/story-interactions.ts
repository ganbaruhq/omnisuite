import { expect, userEvent, waitFor, within } from "storybook/test";

type Canvas = { readonly canvasElement: HTMLElement };
export async function editName({ canvasElement }: Canvas) {
  const input = await within(canvasElement).findByRole("textbox", { name: "Collection name" });
  await userEvent.type(input, "Research notes");
  await expect(input).toHaveValue("Research notes");
}
export async function editDescription({ canvasElement }: Canvas) {
  const input = await within(canvasElement).findByRole("textbox", { name: "Description" });
  await userEvent.type(input, "Shared research");
  await expect(input).toHaveValue("Shared research");
}
export async function checkNotifications({ canvasElement }: Canvas) {
  const checkbox = await within(canvasElement).findByRole("checkbox", { name: "Notify members" });
  await expect(checkbox).not.toBeChecked();
  await userEvent.click(checkbox);
  await expect(checkbox).toBeChecked();
}
export async function switchNotifications({ canvasElement }: Canvas) {
  const control = await within(canvasElement).findByRole("switch", { name: "Notify members" });
  await expect(control).not.toBeChecked();
  await userEvent.click(control);
  await expect(control).toBeChecked();
}
export async function toggleNotifications({ canvasElement }: Canvas) {
  const button = await within(canvasElement).findByRole("button", { name: "Notify members" });
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await userEvent.click(button);
  await expect(button).toHaveAttribute("aria-pressed", "true");
}
export async function chooseGrid({ canvasElement }: Canvas) {
  const radio = await within(canvasElement).findByRole("radio", { name: "Grid" });
  await userEvent.click(radio);
  await expect(radio).toBeChecked();
  await expect(
    await within(canvasElement).findByRole("radio", { name: "Archived" }),
  ).toHaveAttribute("data-disabled");
}
export async function selectOwner({ canvasElement }: Canvas) {
  const trigger = await within(canvasElement).findByRole("combobox", { name: "Owner" });
  await userEvent.click(trigger);
  const option = await within(canvasElement.ownerDocument.body).findByRole("option", {
    name: "Engineering",
  });
  await userEvent.click(option);
  await expect(trigger).toHaveTextContent("Engineering");
}
export async function searchOwner({ canvasElement }: Canvas) {
  const input = await within(canvasElement).findByRole("combobox", { name: "Owner" });
  await userEvent.clear(input);
  await userEvent.type(input, "Eng");
  await userEvent.click(
    await within(canvasElement.ownerDocument.body).findByRole("option", { name: "Engineering" }),
  );
  await expect(input).toHaveValue("Engineering");
}
export async function removeTag({ canvasElement }: Canvas) {
  const canvas = within(canvasElement);
  await userEvent.click(await canvas.findByRole("button", { name: /^Remove Design/ }));
  await expect(canvas.queryByText("Design")).not.toBeInTheDocument();
  await userEvent.click(canvas.getByRole("button", { name: "Reset example" }));
  await expect(canvas.getByText("Design")).toBeVisible();
}
export async function dismissBadge({ canvasElement }: Canvas) {
  const canvas = within(canvasElement);
  const [clear] = canvas.getAllByRole("button", { name: "Clear" });
  if (!clear) throw new Error("Missing dismissible badge");
  await userEvent.click(clear);
  await expect(canvas.getByRole("button", { name: "Reset" })).toBeVisible();
}
export async function openDialog({ canvasElement }: Canvas) {
  await userEvent.click(await within(canvasElement).findByRole("button", { name: "Open dialog" }));
  const body = within(canvasElement.ownerDocument.body);
  await waitFor(() => expect(body.getByRole("dialog", { name: "Confirm changes" })).toBeVisible());
  await userEvent.click(body.getByRole("button", { name: "Cancel" }));
  await waitFor(() =>
    expect(body.queryByRole("dialog", { name: "Confirm changes" })).not.toBeInTheDocument(),
  );
}
export async function syncToast({ canvasElement }: Canvas) {
  await userEvent.click(await within(canvasElement).findByRole("button", { name: "Sync now" }));
  const body = within(canvasElement.ownerDocument.body);
  await expect(await body.findByText("Syncing…")).toBeVisible();
  await waitFor(() => expect(body.getByText("Synced")).toBeVisible(), { timeout: 4000 });
  await expect(body.getByText("1,204 records updated.")).toBeVisible();
}
export async function shareCollection({ canvasElement }: Canvas) {
  const body = within(canvasElement.ownerDocument.body);
  const share = await body.findByRole("menuitem", { name: "Share" });
  await waitFor(() => expect(getComputedStyle(share).pointerEvents).toBe("auto"));
  await userEvent.hover(share);
  const copy = await body.findByRole("menuitem", { name: "Copy link" });
  await waitFor(() => expect(getComputedStyle(copy).pointerEvents).toBe("auto"));
  await userEvent.click(copy);
  await expect(within(canvasElement).getByLabelText("Last action")).toHaveTextContent("link");
}
