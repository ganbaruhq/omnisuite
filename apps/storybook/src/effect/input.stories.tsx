import { editName } from "../story-interactions";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { inputDemo } from "./input";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Form/Input",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(inputDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async (context) => {
    await verifyMount(context);
    await editName(context);
  },
  args: { mount: (element) => BrowserHost.mount(inputDemo("Default"), {}, element) },
};
export const Disabled: Story = {
  args: { mount: (element) => BrowserHost.mount(inputDemo("Disabled"), {}, element) },
};
export const Invalid: Story = {
  args: { mount: (element) => BrowserHost.mount(inputDemo("Invalid"), {}, element) },
};
export const ReadOnly: Story = {
  args: { mount: (element) => BrowserHost.mount(inputDemo("ReadOnly"), {}, element) },
};
export const Sizes: Story = {
  args: { mount: (element) => BrowserHost.mount(inputDemo("Sizes"), {}, element) },
};
