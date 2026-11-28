import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { fieldDemo } from "./field";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Form/Field",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(fieldDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  args: { mount: (element) => BrowserHost.mount(fieldDemo("Default"), {}, element) },
};
export const Horizontal: Story = {
  args: { mount: (element) => BrowserHost.mount(fieldDemo("Horizontal"), {}, element) },
};
export const Responsive: Story = {
  args: { mount: (element) => BrowserHost.mount(fieldDemo("Responsive"), {}, element) },
};
export const Disabled: Story = {
  args: { mount: (element) => BrowserHost.mount(fieldDemo("Disabled"), {}, element) },
};
export const Invalid: Story = {
  args: { mount: (element) => BrowserHost.mount(fieldDemo("Invalid"), {}, element) },
};
