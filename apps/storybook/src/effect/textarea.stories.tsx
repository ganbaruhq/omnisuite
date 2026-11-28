import { editDescription } from "../story-interactions";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { textareaDemo } from "./textarea";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Form/Textarea",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(textareaDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async (context) => {
    await verifyMount(context);
    await editDescription(context);
  },
  args: { mount: (element) => BrowserHost.mount(textareaDemo("Default"), {}, element) },
};
export const Disabled: Story = {
  args: { mount: (element) => BrowserHost.mount(textareaDemo("Disabled"), {}, element) },
};
export const Invalid: Story = {
  args: { mount: (element) => BrowserHost.mount(textareaDemo("Invalid"), {}, element) },
};
export const ReadOnly: Story = {
  args: { mount: (element) => BrowserHost.mount(textareaDemo("ReadOnly"), {}, element) },
};
