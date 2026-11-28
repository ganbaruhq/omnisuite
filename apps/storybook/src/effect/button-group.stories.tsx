import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { button_groupDemo } from "./button-group";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Components/Button group",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(button_groupDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  args: { mount: (element) => BrowserHost.mount(button_groupDemo("Default"), {}, element) },
};
export const Vertical: Story = {
  args: { mount: (element) => BrowserHost.mount(button_groupDemo("Vertical"), {}, element) },
};
export const WithSeparator: Story = {
  args: { mount: (element) => BrowserHost.mount(button_groupDemo("WithSeparator"), {}, element) },
};
