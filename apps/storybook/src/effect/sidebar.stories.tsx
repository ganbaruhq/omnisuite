import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { sidebarDemo } from "./sidebar";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Components/Sidebar",
  component: EffectMount,
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "480px" } } },
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(sidebarDemo("Navigation"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Navigation: Story = {
  args: { mount: (element) => BrowserHost.mount(sidebarDemo("Navigation"), {}, element) },
};
export const Collapsed: Story = {
  args: { mount: (element) => BrowserHost.mount(sidebarDemo("Collapsed"), {}, element) },
};
export const Right: Story = {
  args: { mount: (element) => BrowserHost.mount(sidebarDemo("Right"), {}, element) },
};
