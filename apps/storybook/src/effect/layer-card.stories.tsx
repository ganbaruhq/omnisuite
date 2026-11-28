import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { layer_cardDemo } from "./layer-card";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Components/Layer card",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(layer_cardDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  args: { mount: (element) => BrowserHost.mount(layer_cardDemo("Default"), {}, element) },
};
