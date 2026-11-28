"use client";
import {
  inputGroupClasses,
  inputGroupAddonVariants,
  inputGroupButtonVariants,
  inputGroupTextClasses,
  inputGroupInputClasses,
  inputGroupTextareaClasses,
} from "@omnisuite/ui/lib/recipes/input-group";

import * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { cn } from "cn";

import { Button } from "@omnisuite/ui/components/button";
import { Input, type InputProps } from "@omnisuite/ui/components/input";
import { Textarea } from "@omnisuite/ui/components/textarea";
import type { ControlSize } from "@omnisuite/ui/lib/recipes/control";

function InputGroup({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: ControlSize }) {
  return (
    <div
      data-slot="input-group"
      data-size={size}
      role="group"
      className={cn(...inputGroupClasses, className)}
      {...props}
    />
  );
}

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) {
          return;
        }
        e.currentTarget.parentElement?.querySelector("input")?.focus();
      }}
      {...props}
    />
  );
}

function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size" | "type"> &
  VariantProps<typeof inputGroupButtonVariants> & {
    type?: "button" | "submit" | "reset";
  }) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  );
}

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn(...inputGroupTextClasses, className)} {...props} />;
}

// Height and side padding come from the group (`h-full`, inherited
// `--control-px`), so `size` goes on `InputGroup`.
function InputGroupInput({ className, ...props }: Omit<InputProps, "size">) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(...inputGroupInputClasses, className)}
      {...props}
    />
  );
}

function InputGroupTextarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(...inputGroupTextareaClasses, className)}
      {...props}
    />
  );
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
};
