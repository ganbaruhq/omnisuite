import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { popoverDemo } from "./popover";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  parameters: { docs: { story: { inline: false, height: "320px" } } },
  title: "Effect/Components/Popover",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(popoverDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  args: { mount: (element) => BrowserHost.mount(popoverDemo("Default"), {}, element) },
};
export const Open: Story = {
  args: { mount: (element) => BrowserHost.mount(popoverDemo("Open"), {}, element) },
};
export const Top: Story = {
  args: { mount: (element) => BrowserHost.mount(popoverDemo("Top"), {}, element) },
};
export const Right: Story = {
  args: { mount: (element) => BrowserHost.mount(popoverDemo("Right"), {}, element) },
};
export const Bottom: Story = {
  args: { mount: (element) => BrowserHost.mount(popoverDemo("Bottom"), {}, element) },
};
export const Left: Story = {
  args: { mount: (element) => BrowserHost.mount(popoverDemo("Left"), {}, element) },
};
