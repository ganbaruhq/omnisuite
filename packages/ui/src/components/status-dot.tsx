import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

/**
 * Small coloured dot for a status. Use it on its own (table cell, avatar,
 * sidebar item). Inside a `Badge`, prefer `BadgeDot`, which takes the badge colour:
 *
 *   <Badge color="success"><BadgeDot />Synced</Badge>
 *
 * Decorative by default, since a text label normally sits next to it. When the
 * dot stands alone, pass `aria-label` and it is announced as an image.
 */
const statusDotVariants = cva("inline-block size-1.5 shrink-0 rounded-full", {
  variants: {
    status: {
      success: "bg-success",
      warning: "bg-warning",
      destructive: "bg-destructive",
      info: "bg-info",
      neutral: "bg-muted-foreground/50",
    },
    pulse: {
      true: "animate-pulse motion-reduce:animate-none",
      false: "",
    },
  },
  defaultVariants: {
    status: "neutral",
    pulse: false,
  },
});

type StatusDotStatus = NonNullable<VariantProps<typeof statusDotVariants>["status"]>;

type StatusDotProps = React.ComponentProps<"span"> & VariantProps<typeof statusDotVariants>;

function StatusDot({ className, status, pulse, ...props }: StatusDotProps) {
  const labelled = props["aria-label"] !== undefined;
  return (
    <span
      data-slot="status-dot"
      data-status={status ?? "neutral"}
      role={labelled ? "img" : undefined}
      aria-hidden={labelled ? undefined : true}
      className={cn(statusDotVariants({ status, pulse }), className)}
      {...props}
    />
  );
}

export { StatusDot, statusDotVariants };
export type { StatusDotProps, StatusDotStatus };
