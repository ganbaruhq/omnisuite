import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { labelDemo } from "./label";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Form/Label",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(labelDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  args: { mount: (element) => BrowserHost.mount(labelDemo("Default"), {}, element) },
};
export const Disabled: Story = {
  args: { mount: (element) => BrowserHost.mount(labelDemo("Disabled"), {}, element) },
};
