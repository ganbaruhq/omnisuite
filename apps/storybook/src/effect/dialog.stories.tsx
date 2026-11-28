import { openDialog } from "../story-interactions";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { dialogDemo } from "./dialog";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Components/Dialog",
  component: EffectMount,
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "480px" } } },
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(dialogDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async (context) => {
    await verifyMount(context);
    await openDialog(context);
  },
  args: { mount: (element) => BrowserHost.mount(dialogDemo("Default"), {}, element) },
};
export const Open: Story = {
  args: { mount: (element) => BrowserHost.mount(dialogDemo("Open"), {}, element) },
};
export const Disabled: Story = {
  args: { mount: (element) => BrowserHost.mount(dialogDemo("Disabled"), {}, element) },
};
