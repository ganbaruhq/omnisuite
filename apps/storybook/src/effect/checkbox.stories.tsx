import { checkNotifications } from "../story-interactions";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { checkboxDemo } from "./checkbox";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Form/Checkbox",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(checkboxDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async (context) => {
    await verifyMount(context);
    await checkNotifications(context);
  },
  args: { mount: (element) => BrowserHost.mount(checkboxDemo("Default"), {}, element) },
};
export const Checked: Story = {
  args: { mount: (element) => BrowserHost.mount(checkboxDemo("Checked"), {}, element) },
};
export const Disabled: Story = {
  args: { mount: (element) => BrowserHost.mount(checkboxDemo("Disabled"), {}, element) },
};
export const Invalid: Story = {
  args: { mount: (element) => BrowserHost.mount(checkboxDemo("Invalid"), {}, element) },
};
export const Indeterminate: Story = {
  args: { mount: (element) => BrowserHost.mount(checkboxDemo("Indeterminate"), {}, element) },
};
