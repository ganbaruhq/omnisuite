import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { pageDemo } from "./page";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Components/Page",
  component: EffectMount,
  parameters: { layout: "fullscreen" },
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(pageDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  args: { mount: (element) => BrowserHost.mount(pageDemo("Default"), {}, element) },
};
export const WithAside: Story = {
  args: { mount: (element) => BrowserHost.mount(pageDemo("WithAside"), {}, element) },
};
export const FullBleed: Story = {
  args: { mount: (element) => BrowserHost.mount(pageDemo("FullBleed"), {}, element) },
};
