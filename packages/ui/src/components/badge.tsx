import {
  badgeVariants,
  badgeDotClasses,
  badgeImageClasses,
  badgeWithButtonClasses,
} from "@omnisuite/ui/lib/recipes/badge";
import type * as React from "react";
import { IconX } from "@tabler/icons-react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { VariantProps } from "class-variance-authority";

import { cn } from "cn";

// Untitled UI badges (MIT) https://www.untitledui.com/react/components/badges
// Exact shapes, sizes and shades. Colours come from the `--badge-*` palette in
// globals.css (keyed by `data-color`), so one class list serves every colour.
//
// Composed, not configured: Untitled's BadgeWithDot / WithIcon / WithImage are
// the plain Badge with a child, and padding adapts via `has-*`:
//   <Badge color="success"><BadgeDot />Synced</Badge>
//   <Badge><IconArrowUp data-icon="inline-start" />12%</Badge>
//   <Badge><BadgeImage src={src} />Olivia</Badge>
//   <Badge role="img" aria-label="Add"><IconPlus data-icon="only" /></Badge>  (icon only: name it)
//
// `color` keeps Untitled's names; `gray` is our neutral (mist), `brand` our primary (blue).

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;
type BadgeColor = NonNullable<VariantProps<typeof badgeVariants>["color"]>;
type BadgeSize = NonNullable<VariantProps<typeof badgeVariants>["size"]>;

interface BadgeProps extends Omit<useRender.ComponentProps<"span">, "color"> {
  /** `pill-color` is fully rounded, `color` a rounded rectangle, `modern` white with a shadow. */
  variant?: BadgeVariant | undefined;
  color?: BadgeColor | undefined;
  size?: BadgeSize | undefined;
}

function Badge({
  className,
  variant = "pill-color",
  color = "gray",
  size = "md",
  render,
  ...props
}: BadgeProps) {
  const defaultProps = {
    "data-slot": "badge",
    "data-variant": variant,
    "data-color": color,
    "data-size": size,
    className: cn(badgeVariants({ variant, color, size }), className),
  };

  return useRender({
    defaultTagName: "span",
    render,
    props: mergeProps<"span">(defaultProps, props),
  });
}

/** Leading dot in the badge's colour (500 shade). Decorative: the label carries the meaning. */
function BadgeDot({
  className,
  pulse = false,
  ...props
}: React.ComponentProps<"span"> & { pulse?: boolean | undefined }) {
  return (
    <span
      data-slot="badge-dot"
      aria-hidden="true"
      className={cn(
        ...badgeDotClasses,
        pulse && "animate-pulse motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}

/** Leading round image (avatar, logo, flag). Pass `alt=""` when the label already names it. */
function BadgeImage({ className, alt, ...props }: React.ComponentProps<"img">) {
  return (
    <img
      data-slot="badge-image"
      alt={alt}
      className={cn(...badgeImageClasses, className)}
      {...props}
    />
  );
}

type BadgeWithButtonProps = Omit<BadgeProps, "render"> & {
  buttonLabel: string;
  onButtonClick: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean | undefined;
};

function BadgeWithButton({
  children,
  buttonLabel,
  onButtonClick,
  disabled,
  ...props
}: BadgeWithButtonProps) {
  return (
    <Badge {...props}>
      {children}
      <button
        type="button"
        data-slot="badge-button"
        aria-label={buttonLabel}
        onClick={onButtonClick}
        disabled={disabled}
        className={cn(...badgeWithButtonClasses)}
      >
        <IconX aria-hidden="true" className="size-3" stroke={3} />
      </button>
    </Badge>
  );
}

export { Badge, BadgeDot, BadgeImage, BadgeWithButton, badgeVariants };
export type { BadgeColor, BadgeProps, BadgeSize, BadgeVariant, BadgeWithButtonProps };
