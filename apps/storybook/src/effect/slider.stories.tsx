import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { sliderDemo } from "./slider";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Form/Slider",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(sliderDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  args: { mount: (element) => BrowserHost.mount(sliderDemo("Default"), {}, element) },
};
export const Range: Story = {
  args: { mount: (element) => BrowserHost.mount(sliderDemo("Range"), {}, element) },
};
export const Disabled: Story = {
  args: { mount: (element) => BrowserHost.mount(sliderDemo("Disabled"), {}, element) },
};
export const Vertical: Story = {
  args: { mount: (element) => BrowserHost.mount(sliderDemo("Vertical"), {}, element) },
};
