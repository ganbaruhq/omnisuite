import { toggleNotifications } from "../story-interactions";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { toggleDemo } from "./toggle";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Form/Toggle",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(toggleDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async (context) => {
    await verifyMount(context);
    await toggleNotifications(context);
  },
  args: { mount: (element) => BrowserHost.mount(toggleDemo("Default"), {}, element) },
};
export const Pressed: Story = {
  args: { mount: (element) => BrowserHost.mount(toggleDemo("Pressed"), {}, element) },
};
export const Disabled: Story = {
  args: { mount: (element) => BrowserHost.mount(toggleDemo("Disabled"), {}, element) },
};
export const Invalid: Story = {
  args: { mount: (element) => BrowserHost.mount(toggleDemo("Invalid"), {}, element) },
};
export const Sizes: Story = {
  args: { mount: (element) => BrowserHost.mount(toggleDemo("Sizes"), {}, element) },
};
export const Outline: Story = {
  args: { mount: (element) => BrowserHost.mount(toggleDemo("Outline"), {}, element) },
};
