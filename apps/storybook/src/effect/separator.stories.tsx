import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { separatorDemo } from "./separator";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Components/Separator",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(separatorDemo("Horizontal"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Horizontal: Story = {
  args: { mount: (element) => BrowserHost.mount(separatorDemo("Horizontal"), {}, element) },
};
export const Vertical: Story = {
  args: { mount: (element) => BrowserHost.mount(separatorDemo("Vertical"), {}, element) },
};
