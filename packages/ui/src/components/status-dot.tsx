import { statusDotVariants } from "@omnisuite/ui/lib/recipes/status-dot";
import type * as React from "react";
import type { VariantProps } from "class-variance-authority";
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
