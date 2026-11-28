import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { input_groupDemo } from "./input-group";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Form/Input group",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(input_groupDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  args: { mount: (element) => BrowserHost.mount(input_groupDemo("Default"), {}, element) },
};
export const Disabled: Story = {
  args: { mount: (element) => BrowserHost.mount(input_groupDemo("Disabled"), {}, element) },
};
export const Invalid: Story = {
  args: { mount: (element) => BrowserHost.mount(input_groupDemo("Invalid"), {}, element) },
};
export const Sizes: Story = {
  args: { mount: (element) => BrowserHost.mount(input_groupDemo("Sizes"), {}, element) },
};
export const Multiline: Story = {
  args: { mount: (element) => BrowserHost.mount(input_groupDemo("Multiline"), {}, element) },
};
