import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { skeletonDemo } from "./skeleton";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Components/Skeleton",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(skeletonDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  args: { mount: (element) => BrowserHost.mount(skeletonDemo("Default"), {}, element) },
};
export const Card: Story = {
  args: { mount: (element) => BrowserHost.mount(skeletonDemo("Card"), {}, element) },
};
