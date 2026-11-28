import type { Html } from "@effect/ui/html";
import { styledSlot } from "@omnisuite/ui/effect/lib/styled";
import {
  textVariants,
  type CopyVariant,
  type MonoVariant,
  type TextSize,
} from "@omnisuite/ui/lib/recipes/text";

export type TextElement =
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
export type TextOptions = { readonly as?: TextElement; readonly truncate?: boolean } & (
  | { readonly variant?: CopyVariant; readonly size?: TextSize; readonly bold?: boolean }
  | { readonly variant: MonoVariant | "heading"; readonly size?: "lg"; readonly bold?: never }
);
/** Visual variant is independent of document semantics; choose `as` for headings. */
export const Text = <Msg>(h: Pick<Html.H<Msg>, TextElement>, options: TextOptions = {}) => {
  const { variant = "body", size, truncate = false } = options;
  const isCopy = variant !== "heading" && variant !== "mono" && variant !== "mono-secondary";
  const tag = options.as ?? (isCopy ? "p" : "span");
  return styledSlot(
    h[tag],
    "text",
    textVariants({ variant, size }),
    isCopy && options.bold && "font-medium",
    truncate && "min-w-0 truncate",
  ).attr("data-variant", variant);
};
export { textVariants };
export type { TextSize, TextVariant } from "@omnisuite/ui/lib/recipes/text";
