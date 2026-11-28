import { syncToast } from "../story-interactions";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { toastDemo } from "./toast";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Components/Toast",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(toastDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  args: { mount: (element) => BrowserHost.mount(toastDemo("Default"), {}, element) },
};
export const Avatar: Story = {
  args: { mount: (element) => BrowserHost.mount(toastDemo("Avatar"), {}, element) },
};
export const Types: Story = {
  args: { mount: (element) => BrowserHost.mount(toastDemo("Types"), {}, element) },
};
export const WithAction: Story = {
  args: { mount: (element) => BrowserHost.mount(toastDemo("WithAction"), {}, element) },
};
export const Promise: Story = {
  play: async (context) => {
    await verifyMount(context);
    await syncToast(context);
  },
  args: { mount: (element) => BrowserHost.mount(toastDemo("Promise"), {}, element) },
};
