import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { cardDemo } from "./card";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Components/Card",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(cardDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  args: { mount: (element) => BrowserHost.mount(cardDemo("Default"), {}, element) },
};
export const Small: Story = {
  args: { mount: (element) => BrowserHost.mount(cardDemo("Small"), {}, element) },
};
