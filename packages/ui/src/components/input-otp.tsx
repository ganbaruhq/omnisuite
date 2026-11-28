"use client";

import * as React from "react";
import { cn } from "cn";
import {
  inputOTPContainerClasses,
  inputOTPClasses,
  inputOTPGroupClasses,
  inputOTPSlotClasses,
  inputOTPSeparatorClasses,
  inputOTPCaretContainerClasses,
  inputOTPCaretClasses,
} from "@omnisuite/ui/lib/recipes/input-otp";
import { OTPInput, OTPInputContext } from "input-otp";
import { IconMinus } from "@tabler/icons-react";

function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string;
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(inputOTPContainerClasses, containerClassName)}
      spellCheck={false}
      className={cn(inputOTPClasses, className)}
      {...props}
    />
  );
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="input-otp-group" className={cn(inputOTPGroupClasses, className)} {...props} />
  );
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  index: number;
}) {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(inputOTPSlotClasses, className)}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className={inputOTPCaretContainerClasses}>
          <div className={inputOTPCaretClasses} />
        </div>
      )}
    </div>
  );
}

function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-separator"
      className={inputOTPSeparatorClasses}
      role="separator"
      {...props}
    >
      <IconMinus />
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
