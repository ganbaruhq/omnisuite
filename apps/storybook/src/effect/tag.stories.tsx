import { removeTag } from "../story-interactions";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { tagDemo } from "./tag";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Components/Tag",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(tagDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  args: { mount: (element) => BrowserHost.mount(tagDemo("Default"), {}, element) },
};
export const Sizes: Story = {
  args: { mount: (element) => BrowserHost.mount(tagDemo("Sizes"), {}, element) },
};
export const Removable: Story = {
  play: async (context) => {
    await verifyMount(context);
    await removeTag(context);
  },
  args: { mount: (element) => BrowserHost.mount(tagDemo("Removable"), {}, element) },
};
export const Selectable: Story = {
  args: { mount: (element) => BrowserHost.mount(tagDemo("Selectable"), {}, element) },
};
export const SingleSelect: Story = {
  args: { mount: (element) => BrowserHost.mount(tagDemo("SingleSelect"), {}, element) },
};
export const SelectableRemovable: Story = {
  args: { mount: (element) => BrowserHost.mount(tagDemo("SelectableRemovable"), {}, element) },
};
