import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { input_otpDemo } from "./input-otp";
import { EffectMount } from "./effect-mount";
import { verifyMount } from "./verify-mount";
const meta = {
  title: "Effect/Form/Input OTP",
  component: EffectMount,
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(input_otpDemo("Default"), {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  args: { mount: (element) => BrowserHost.mount(input_otpDemo("Default"), {}, element) },
};
export const Filled: Story = {
  args: { mount: (element) => BrowserHost.mount(input_otpDemo("Filled"), {}, element) },
};
export const Disabled: Story = {
  args: { mount: (element) => BrowserHost.mount(input_otpDemo("Disabled"), {}, element) },
};
export const Invalid: Story = {
  args: { mount: (element) => BrowserHost.mount(input_otpDemo("Invalid"), {}, element) },
};
