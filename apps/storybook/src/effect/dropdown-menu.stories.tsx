import { shareCollection } from "../story-interactions";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { dropdown_menuDemo } from "./dropdown-menu";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  parameters: { docs: { story: { inline: false, height: "320px" } } },
  title: "Effect/Components/Dropdown menu",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(dropdown_menuDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  args: { mount: (element) => BrowserHost.mount(dropdown_menuDemo("Default"), {}, element) },
};
export const Open: Story = {
  args: { mount: (element) => BrowserHost.mount(dropdown_menuDemo("Open"), {}, element) },
};
export const Choices: Story = {
  args: { mount: (element) => BrowserHost.mount(dropdown_menuDemo("Choices"), {}, element) },
};

export const Nested: Story = {
  play: async (context) => {
    await verifyMount(context);
    await shareCollection(context);
  },
  args: { mount: (element) => BrowserHost.mount(dropdown_menuDemo("Nested"), {}, element) },
};
