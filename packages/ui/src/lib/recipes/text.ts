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

export { textVariants, type CopyVariant, type MonoVariant, type TextSize, type TextVariant };
