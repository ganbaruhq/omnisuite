import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { drawerDemo } from "./drawer";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Components/Drawer",
  component: EffectMount,
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "480px" } } },
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(drawerDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  args: { mount: (element) => BrowserHost.mount(drawerDemo("Default"), {}, element) },
};
export const Open: Story = {
  args: { mount: (element) => BrowserHost.mount(drawerDemo("Open"), {}, element) },
};
export const Disabled: Story = {
  args: { mount: (element) => BrowserHost.mount(drawerDemo("Disabled"), {}, element) },
};
export const WithSnapPoints: Story = {
  args: { mount: (element) => BrowserHost.mount(drawerDemo("WithSnapPoints"), {}, element) },
};
export const Right: Story = {
  args: { mount: (element) => BrowserHost.mount(drawerDemo("Right"), {}, element) },
};
