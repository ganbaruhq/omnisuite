import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { status_dotDemo } from "./status-dot";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Components/Status dot",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(status_dotDemo("Statuses"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Statuses: Story = {
  args: { mount: (element) => BrowserHost.mount(status_dotDemo("Statuses"), {}, element) },
};
export const Pulse: Story = {
  args: { mount: (element) => BrowserHost.mount(status_dotDemo("Pulse"), {}, element) },
};
