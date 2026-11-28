import type { Meta, StoryObj } from "@storybook/react-vite";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@omnisuite/ui/components/input-otp";

const meta = { title: "React/Form/Input OTP" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => (
    <InputOTP
      maxLength={6}
      aria-label="Verification code"
      defaultValue=""
      disabled={false}
      aria-invalid={false}
    >
      <InputOTPGroup>
        {Array.from({ length: 6 }, (_, index) => (
          <InputOTPSlot key={index} index={index} aria-invalid={false} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  ),
};
export const Filled: Story = {
  render: () => (
    <InputOTP
      maxLength={6}
      aria-label="Verification code"
      defaultValue="123456"
      disabled={false}
      aria-invalid={false}
    >
      <InputOTPGroup>
        {Array.from({ length: 6 }, (_, index) => (
          <InputOTPSlot key={index} index={index} aria-invalid={false} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  ),
};
export const Disabled: Story = {
  render: () => (
    <InputOTP
      maxLength={6}
      aria-label="Verification code"
      defaultValue=""
      disabled={true}
      aria-invalid={false}
    >
      <InputOTPGroup>
        {Array.from({ length: 6 }, (_, index) => (
          <InputOTPSlot key={index} index={index} aria-invalid={false} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  ),
};
export const Invalid: Story = {
  render: () => (
    <InputOTP
      maxLength={6}
      aria-label="Verification code"
      defaultValue=""
      disabled={false}
      aria-invalid={true}
    >
      <InputOTPGroup>
        {Array.from({ length: 6 }, (_, index) => (
          <InputOTPSlot key={index} index={index} aria-invalid={true} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  ),
};
