import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { toolbarDemo } from "./toolbar";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Components/Toolbar",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(toolbarDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  args: { mount: (element) => BrowserHost.mount(toolbarDemo("Default"), {}, element) },
};
export const Disabled: Story = {
  args: { mount: (element) => BrowserHost.mount(toolbarDemo("Disabled"), {}, element) },
};
