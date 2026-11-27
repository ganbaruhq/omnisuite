// Adapted from Cloudflare Kumo's `Text` (MIT, https://github.com/cloudflare/kumo).
// Changes: shadcn colour tokens, `className` instead of `DANGEROUS_className`,
// React 19 ref-as-prop, deprecated `heading1`–`heading3` dropped.
import * as React from "react";
import { cn } from "cn";

/*
 * Sizes keep Kumo's pixel scale, which is one step below Tailwind's defaults:
 *   copy:    xs 12px · sm 13px · base 14px (default) · lg 16px
 *   heading: 16px (default) · lg 20px
 *   mono:    13px (default) · lg 14px — 1px under copy so it optically matches
 */
const textVariantClasses = {
  heading: "font-heading font-semibold text-foreground",
  body: "text-foreground",
  secondary: "text-muted-foreground",
  success: "text-success-foreground",
  error: "text-destructive",
  mono: "font-mono text-foreground",
  "mono-secondary": "font-mono text-muted-foreground",
} as const;

const copySizeClasses = {
  xs: "text-xs",
  sm: "text-[13px]/5",
  base: "text-sm",
  lg: "text-base",
} as const;

type TextVariant = keyof typeof textVariantClasses;
type TextSize = keyof typeof copySizeClasses;
type CopyVariant = "body" | "secondary" | "success" | "error";
type MonoVariant = "mono" | "mono-secondary";

type TextElement =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "p"
  | "span"
  | "label"
  | "dt"
  | "dd"
  | "li"
  | "figcaption"
  | "legend"
  | "pre"
  | "code"
  | "em"
  | "strong"
  | "small"
  | "abbr"
  | "time";

type BaseTextProps = Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
  ref?: React.Ref<HTMLElement>;
  children?: React.ReactNode;
  /** Element to render. `variant` is visual only; pick `as` for the document outline. */
  as?: TextElement;
  /** Clip overflow with an ellipsis. Needs a flex/grid or width-constrained parent. */
  truncate?: boolean;
};

type TextProps = BaseTextProps &
  (
    | { variant?: CopyVariant; size?: TextSize; bold?: boolean }
    | { variant: MonoVariant; size?: "lg"; bold?: never }
    | { variant: "heading"; size?: "lg"; bold?: never }
  );

function textSizeClasses(variant: TextVariant, size: TextSize | undefined) {
  if (variant === "heading") return size === "lg" ? "text-xl" : "text-base";
  if (variant === "mono" || variant === "mono-secondary") {
    return size === "lg" ? copySizeClasses.base : copySizeClasses.sm;
  }
  return copySizeClasses[size ?? "base"];
}

function textVariants({
  variant = "body",
  size,
}: { variant?: TextVariant; size?: TextSize | undefined } = {}) {
  return cn(textVariantClasses[variant], textSizeClasses(variant, size));
}

/** Copy renders `<p>`; headings and mono render `<span>` unless `as` is set. */
function defaultElement(variant: TextVariant): TextElement {
  return variant === "heading" || variant === "mono" || variant === "mono-secondary" ? "span" : "p";
}

/**
 * @example
 * <Text as="h1" variant="heading" size="lg">Page title</Text>
 * <Text>Body copy</Text>
 * <Text variant="secondary" size="sm">Helper text</Text>
 * <Text variant="mono">pnpm dev</Text>
 */
function Text({
  as,
  variant = "body",
  size,
  bold = false,
  truncate = false,
  className,
  ...props
}: TextProps) {
  const Component = as ?? defaultElement(variant);
  const isCopy = variant !== "heading" && variant !== "mono" && variant !== "mono-secondary";

  return (
    <Component
      data-slot="text"
      data-variant={variant}
      className={cn(
        textVariants({ variant, size }),
        isCopy && bold && "font-medium",
        truncate && "min-w-0 truncate",
        className,
      )}
      {...(props as React.HTMLAttributes<HTMLElement>)}
    />
  );
}

export { Text, textVariants, type TextElement, type TextProps, type TextSize, type TextVariant };
