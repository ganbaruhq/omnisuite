import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { sheetDemo } from "./sheet";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Components/Sheet",
  component: EffectMount,
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "480px" } } },
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(sheetDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  args: { mount: (element) => BrowserHost.mount(sheetDemo("Default"), {}, element) },
};
export const Open: Story = {
  args: { mount: (element) => BrowserHost.mount(sheetDemo("Open"), {}, element) },
};
export const Disabled: Story = {
  args: { mount: (element) => BrowserHost.mount(sheetDemo("Disabled"), {}, element) },
};
export const Top: Story = {
  args: { mount: (element) => BrowserHost.mount(sheetDemo("Top"), {}, element) },
};
export const Bottom: Story = {
  args: { mount: (element) => BrowserHost.mount(sheetDemo("Bottom"), {}, element) },
};
export const Left: Story = {
  args: { mount: (element) => BrowserHost.mount(sheetDemo("Left"), {}, element) },
};
