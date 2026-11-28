import { dismissBadge } from "../story-interactions";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { badgeDemo } from "./badge";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Components/Badge",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(badgeDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  args: { mount: (element) => BrowserHost.mount(badgeDemo("Default"), {}, element) },
};
export const Example: Story = {
  args: { mount: (element) => BrowserHost.mount(badgeDemo("Example"), {}, element) },
};
export const Pill: Story = {
  play: async (context) => {
    await verifyMount(context);
    await dismissBadge(context);
  },
  args: { mount: (element) => BrowserHost.mount(badgeDemo("Pill"), {}, element) },
};
export const Rectangle: Story = {
  name: "Badge",
  args: { mount: (element) => BrowserHost.mount(badgeDemo("Rectangle"), {}, element) },
};
export const Modern: Story = {
  args: { mount: (element) => BrowserHost.mount(badgeDemo("Modern"), {}, element) },
};
