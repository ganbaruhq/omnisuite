import { switchNotifications } from "../story-interactions";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { switchDemo } from "./switch";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Form/Switch",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(switchDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async (context) => {
    await verifyMount(context);
    await switchNotifications(context);
  },
  args: { mount: (element) => BrowserHost.mount(switchDemo("Default"), {}, element) },
};
export const Checked: Story = {
  args: { mount: (element) => BrowserHost.mount(switchDemo("Checked"), {}, element) },
};
export const Disabled: Story = {
  args: { mount: (element) => BrowserHost.mount(switchDemo("Disabled"), {}, element) },
};
export const Invalid: Story = {
  args: { mount: (element) => BrowserHost.mount(switchDemo("Invalid"), {}, element) },
};
export const Sizes: Story = {
  args: { mount: (element) => BrowserHost.mount(switchDemo("Sizes"), {}, element) },
};
