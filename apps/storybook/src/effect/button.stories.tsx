import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { expect, within } from "storybook/test";
import { buttonDemo } from "./button";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";

const meta = {
  title: "Effect/Components/Button",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(buttonDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async (context) => {
    await verifyMount(context);
    await expect(
      within(context.canvasElement).getByRole("button", { name: "Save changes" }),
    ).toBeEnabled();
  },
};
export const Variants: Story = {
  args: { mount: (element) => BrowserHost.mount(buttonDemo("Variants"), {}, element) },
};
export const Sizes: Story = {
  args: { mount: (element) => BrowserHost.mount(buttonDemo("Sizes"), {}, element) },
};
export const Disabled: Story = {
  args: { mount: (element) => BrowserHost.mount(buttonDemo("Disabled"), {}, element) },
  play: async (context) => {
    await verifyMount(context);
    await expect(
      within(context.canvasElement).getByRole("button", { name: "Save changes" }),
    ).toBeDisabled();
  },
};
export const Pending: Story = {
  args: { mount: (element) => BrowserHost.mount(buttonDemo("Pending"), {}, element) },
  play: async (context) => {
    await verifyMount(context);
    await expect(
      within(context.canvasElement).getByRole("button", { name: "Saving" }),
    ).toHaveAttribute("aria-busy", "true");
  },
};
