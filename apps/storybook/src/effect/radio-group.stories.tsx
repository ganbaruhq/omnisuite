import { chooseGrid } from "../story-interactions";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { radio_groupDemo } from "./radio-group";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Form/Radio group",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(radio_groupDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async (context) => {
    await verifyMount(context);
    await chooseGrid(context);
  },
  args: { mount: (element) => BrowserHost.mount(radio_groupDemo("Default"), {}, element) },
};
export const Disabled: Story = {
  args: { mount: (element) => BrowserHost.mount(radio_groupDemo("Disabled"), {}, element) },
};
export const Invalid: Story = {
  args: { mount: (element) => BrowserHost.mount(radio_groupDemo("Invalid"), {}, element) },
};
export const Horizontal: Story = {
  args: { mount: (element) => BrowserHost.mount(radio_groupDemo("Horizontal"), {}, element) },
};
