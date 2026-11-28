// Adapted from Cloudflare Kumo's `Text` (MIT, https://github.com/cloudflare/kumo).
// Changes: shadcn colour tokens, `className` instead of `DANGEROUS_className`,
// React 19 ref-as-prop, deprecated `heading1`–`heading3` dropped.
import * as React from "react";
import { cn } from "cn";
import {
  textVariants,
  type CopyVariant,
  type MonoVariant,
  type TextSize,
  type TextVariant,
} from "@omnisuite/ui/lib/recipes/text";

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
