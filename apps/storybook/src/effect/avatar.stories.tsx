import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { avatarDemo } from "./avatar";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Components/Avatar",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(avatarDemo("TextContent"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const TextContent: Story = {
  args: { mount: (element) => BrowserHost.mount(avatarDemo("TextContent"), {}, element) },
};
export const Placeholder: Story = {
  args: { mount: (element) => BrowserHost.mount(avatarDemo("Placeholder"), {}, element) },
};
export const Sizes: Story = {
  args: { mount: (element) => BrowserHost.mount(avatarDemo("Sizes"), {}, element) },
};
export const Image: Story = {
  args: { mount: (element) => BrowserHost.mount(avatarDemo("Image"), {}, element) },
};
export const FailedImage: Story = {
  args: { mount: (element) => BrowserHost.mount(avatarDemo("FailedImage"), {}, element) },
};
export const Group: Story = {
  args: { mount: (element) => BrowserHost.mount(avatarDemo("Group"), {}, element) },
};
