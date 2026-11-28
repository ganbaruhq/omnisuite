import { selectOwner } from "../story-interactions";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { selectDemo } from "./select";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  parameters: { docs: { story: { inline: false, height: "320px" } } },
  title: "Effect/Form/Select",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(selectDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async (context) => {
    await verifyMount(context);
    await selectOwner(context);
  },
  args: { mount: (element) => BrowserHost.mount(selectDemo("Default"), {}, element) },
};
export const Placeholder: Story = {
  args: { mount: (element) => BrowserHost.mount(selectDemo("Placeholder"), {}, element) },
};
export const Open: Story = {
  args: { mount: (element) => BrowserHost.mount(selectDemo("Open"), {}, element) },
};
export const Disabled: Story = {
  args: { mount: (element) => BrowserHost.mount(selectDemo("Disabled"), {}, element) },
};
export const Invalid: Story = {
  args: { mount: (element) => BrowserHost.mount(selectDemo("Invalid"), {}, element) },
};
export const Sizes: Story = {
  args: { mount: (element) => BrowserHost.mount(selectDemo("Sizes"), {}, element) },
};
