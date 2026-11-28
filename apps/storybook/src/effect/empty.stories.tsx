import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { emptyDemo } from "./empty";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Components/Empty",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(emptyDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  args: { mount: (element) => BrowserHost.mount(emptyDemo("Default"), {}, element) },
};
export const Icon: Story = {
  args: { mount: (element) => BrowserHost.mount(emptyDemo("Icon"), {}, element) },
};
export const WithoutAction: Story = {
  args: { mount: (element) => BrowserHost.mount(emptyDemo("WithoutAction"), {}, element) },
};
