import { searchOwner } from "../story-interactions";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { comboboxDemo } from "./combobox";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  parameters: { docs: { story: { inline: false, height: "320px" } } },
  title: "Effect/Form/Combobox",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(comboboxDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async (context) => {
    await verifyMount(context);
    await searchOwner(context);
  },
  args: { mount: (element) => BrowserHost.mount(comboboxDemo("Default"), {}, element) },
};
export const Open: Story = {
  args: { mount: (element) => BrowserHost.mount(comboboxDemo("Open"), {}, element) },
};
export const Disabled: Story = {
  args: { mount: (element) => BrowserHost.mount(comboboxDemo("Disabled"), {}, element) },
};
export const Invalid: Story = {
  args: { mount: (element) => BrowserHost.mount(comboboxDemo("Invalid"), {}, element) },
};
export const Empty: Story = {
  args: { mount: (element) => BrowserHost.mount(comboboxDemo("Empty"), {}, element) },
};
export const Multiple: Story = {
  args: { mount: (element) => BrowserHost.mount(comboboxDemo("Multiple"), {}, element) },
};
export const Sizes: Story = {
  args: { mount: (element) => BrowserHost.mount(comboboxDemo("Sizes"), {}, element) },
};
