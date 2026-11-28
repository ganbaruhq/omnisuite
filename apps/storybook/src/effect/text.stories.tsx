import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { textDemo } from "./text";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Components/Text",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(textDemo("Scale"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Scale: Story = {
  args: { mount: (element) => BrowserHost.mount(textDemo("Scale"), {}, element) },
};
export const Variants: Story = {
  args: { mount: (element) => BrowserHost.mount(textDemo("Variants"), {}, element) },
};
export const Sizes: Story = {
  args: { mount: (element) => BrowserHost.mount(textDemo("Sizes"), {}, element) },
};
export const Truncated: Story = {
  args: { mount: (element) => BrowserHost.mount(textDemo("Truncated"), {}, element) },
};
