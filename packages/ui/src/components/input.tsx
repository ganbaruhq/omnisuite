import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "cn";
import type { ControlSize } from "@omnisuite/ui/lib/recipes/control";
import { inputClasses } from "@omnisuite/ui/lib/recipes/input";

// `size` is the control height (see `recipes/control`), not the native
// character-width attribute; set a width with `className` instead.
type InputProps = Omit<React.ComponentProps<"input">, "size"> & {
  size?: ControlSize;
};

function Input({ className, type, size = "default", ...props }: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      data-size={size}
      className={cn(inputClasses, className)}
      {...props}
    />
  );
}

export { Input };
export type { InputProps };
