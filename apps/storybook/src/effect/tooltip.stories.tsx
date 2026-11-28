import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { tooltipDemo } from "./tooltip";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  parameters: { docs: { story: { inline: false, height: "320px" } } },
  title: "Effect/Components/Tooltip",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(tooltipDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  args: { mount: (element) => BrowserHost.mount(tooltipDemo("Default"), {}, element) },
};
export const Open: Story = {
  args: { mount: (element) => BrowserHost.mount(tooltipDemo("Open"), {}, element) },
};
export const Top: Story = {
  args: { mount: (element) => BrowserHost.mount(tooltipDemo("Top"), {}, element) },
};
export const Right: Story = {
  args: { mount: (element) => BrowserHost.mount(tooltipDemo("Right"), {}, element) },
};
export const Bottom: Story = {
  args: { mount: (element) => BrowserHost.mount(tooltipDemo("Bottom"), {}, element) },
};
export const Left: Story = {
  args: { mount: (element) => BrowserHost.mount(tooltipDemo("Left"), {}, element) },
};
