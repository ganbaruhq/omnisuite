import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { toggle_groupDemo } from "./toggle-group";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Form/Toggle group",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(toggle_groupDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  args: { mount: (element) => BrowserHost.mount(toggle_groupDemo("Default"), {}, element) },
};
export const Multiple: Story = {
  args: { mount: (element) => BrowserHost.mount(toggle_groupDemo("Multiple"), {}, element) },
};
export const Disabled: Story = {
  args: { mount: (element) => BrowserHost.mount(toggle_groupDemo("Disabled"), {}, element) },
};
export const Vertical: Story = {
  args: { mount: (element) => BrowserHost.mount(toggle_groupDemo("Vertical"), {}, element) },
};
export const Outline: Story = {
  args: { mount: (element) => BrowserHost.mount(toggle_groupDemo("Outline"), {}, element) },
};
export const Joined: Story = {
  args: { mount: (element) => BrowserHost.mount(toggle_groupDemo("Joined"), {}, element) },
};
export const Sizes: Story = {
  args: { mount: (element) => BrowserHost.mount(toggle_groupDemo("Sizes"), {}, element) },
};
