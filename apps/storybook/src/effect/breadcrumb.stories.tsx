import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { breadcrumbDemo } from "./breadcrumb";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Components/Breadcrumb",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(breadcrumbDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  args: { mount: (element) => BrowserHost.mount(breadcrumbDemo("Default"), {}, element) },
};
export const Collapsed: Story = {
  args: { mount: (element) => BrowserHost.mount(breadcrumbDemo("Collapsed"), {}, element) },
};
