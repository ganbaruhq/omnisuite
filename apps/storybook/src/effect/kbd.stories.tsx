import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { kbdDemo } from "./kbd";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Components/Kbd",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(kbdDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  args: { mount: (element) => BrowserHost.mount(kbdDemo("Default"), {}, element) },
};
export const Shortcut: Story = {
  args: { mount: (element) => BrowserHost.mount(kbdDemo("Shortcut"), {}, element) },
};
