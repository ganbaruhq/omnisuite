import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { collapsibleDemo } from "./collapsible";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Components/Collapsible",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(collapsibleDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  args: { mount: (element) => BrowserHost.mount(collapsibleDemo("Default"), {}, element) },
};
export const Open: Story = {
  args: { mount: (element) => BrowserHost.mount(collapsibleDemo("Open"), {}, element) },
};
export const Disabled: Story = {
  args: { mount: (element) => BrowserHost.mount(collapsibleDemo("Disabled"), {}, element) },
};
