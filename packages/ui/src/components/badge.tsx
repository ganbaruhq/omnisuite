import type * as React from "react";
import { IconX } from "@tabler/icons-react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

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

const badgeVariants = cva(
  [
    "group/badge relative inline-flex w-fit shrink-0 items-center font-medium whitespace-nowrap ring-1 ring-inset",
    "bg-(--badge-bg) text-(--badge-fg) ring-(--badge-ring)",
    "outline-ring outline-offset-2 focus-visible:outline-2",
    "[&>svg]:pointer-events-none [&>svg]:size-3 [&>svg]:shrink-0 [&>svg]:stroke-3 [&>svg]:text-(--badge-addon)",
    // StatusDot gets the same 8px box / 6px dot as BadgeDot.
    "[&>[data-slot=status-dot]]:size-2 [&>[data-slot=status-dot]]:border [&>[data-slot=status-dot]]:border-transparent [&>[data-slot=status-dot]]:bg-clip-padding",
    // Close button: same pr and gap at every shape.
    "has-data-[slot=badge-button]:gap-0.5",
  ],
  {
    variants: {
      variant: {
        "pill-color": "rounded-full",
        color: "rounded-sm",
        // Only the dot/icon takes the colour.
        modern:
          "rounded-sm bg-background text-mist-700 shadow-xs ring-mist-300 dark:text-mist-300 dark:ring-mist-700",
      },
      color: {
        gray: "",
        brand: "",
        error: "",
        warning: "",
        success: "",
        slate: "",
        sky: "",
        blue: "",
        indigo: "",
        purple: "",
        pink: "",
        orange: "",
      },
      size: {
        sm: "py-0.5 text-xs/4.5 has-data-[slot=badge-button]:pr-0.75 has-data-[icon=only]:p-1.25",
        md: "py-0.5 text-sm/5 has-data-[slot=badge-button]:pr-1 has-data-[icon=only]:p-1.5",
        lg: "py-1 text-sm/5 has-data-[slot=badge-button]:pr-1.5 has-data-[icon=only]:p-2",
      },
    },
    compoundVariants: [
      // Rounded rectangle (`color`, `modern`).
      {
        variant: ["color", "modern"],
        size: "sm",
        className: [
          "gap-1 px-1.5",
          "has-data-[icon]:gap-0.5 has-data-[icon=inline-start]:pr-2 has-data-[icon=inline-end]:pl-2",
          "has-data-[slot=badge-image]:pl-1",
        ],
      },
      {
        variant: ["color", "modern"],
        size: "md",
        className: [
          "gap-1.5 px-2",
          "has-data-[icon]:gap-1 has-data-[icon=inline-start]:pl-1.5 has-data-[icon=inline-end]:pr-1.5",
          "has-data-[slot=badge-image]:pl-1.5",
        ],
      },
      {
        variant: ["color", "modern"],
        size: "lg",
        className: [
          "gap-1.5 rounded-md px-2.5",
          "has-data-[icon]:gap-1 has-data-[icon=inline-start]:pl-2 has-data-[icon=inline-end]:pr-2",
          "has-data-[slot=badge-image]:pl-2",
        ],
      },
      // Pill. A leading dot (BadgeDot or StatusDot: data-slot ends in `dot`) tightens pl.
      {
        variant: "pill-color",
        size: "sm",
        className: [
          "gap-1 px-2 has-[[data-slot$=dot]]:pl-1.5",
          "has-data-[icon]:gap-0.5 has-data-[icon=inline-start]:pl-1.5 has-data-[icon=inline-end]:pr-1.5",
          "has-data-[slot=badge-image]:pl-0.75",
        ],
      },
      {
        variant: "pill-color",
        size: "md",
        className: [
          "gap-1.5 px-2.5 has-[[data-slot$=dot]]:pl-2",
          "has-data-[icon]:gap-1 has-data-[icon=inline-start]:pl-2 has-data-[icon=inline-end]:pr-2",
          "has-data-[slot=badge-image]:pl-1",
        ],
      },
      {
        variant: "pill-color",
        size: "lg",
        className: [
          "gap-1.5 px-3 has-[[data-slot$=dot]]:pl-2.5",
          "has-data-[icon]:gap-1 has-data-[icon=inline-start]:pl-2.5 has-data-[icon=inline-end]:pr-2.5",
          "has-data-[slot=badge-image]:pl-1.5",
        ],
      },
    ],
    defaultVariants: {
      variant: "pill-color",
      color: "gray",
      size: "md",
    },
  },
);

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
        // 8px box, 6px dot — Untitled's `Dot size="sm"`.
        "size-2 shrink-0 rounded-full border border-transparent bg-(--badge-addon) bg-clip-padding",
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
      className={cn("size-4 max-w-none shrink-0 rounded-full object-cover", className)}
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
        className={cn(
          "flex shrink-0 cursor-pointer items-center justify-center rounded-[3px] p-0.5 text-(--badge-button) transition duration-100 ease-linear group-data-[variant=pill-color]/badge:rounded-full",
          "outline-ring hover:bg-(--badge-button-hover) hover:text-(--badge-addon) focus-visible:outline-2",
          "disabled:pointer-events-none disabled:opacity-50",
        )}
      >
        <IconX aria-hidden="true" className="size-3" stroke={3} />
      </button>
    </Badge>
  );
}

export { Badge, BadgeDot, BadgeImage, BadgeWithButton, badgeVariants };
export type { BadgeColor, BadgeProps, BadgeSize, BadgeVariant, BadgeWithButtonProps };
