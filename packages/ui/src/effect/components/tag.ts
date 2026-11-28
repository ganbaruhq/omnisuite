import type { Html } from "@effect/ui/html";
import { styledSlot } from "@omnisuite/ui/effect/lib/styled";
import {
  tagContentClasses,
  contentGap,
  tagGroupClasses,
  tagCountClasses,
  tagVariants,
  countSize,
} from "@omnisuite/ui/lib/recipes/tag";

export const TagGroup = <Msg>(
  h: Pick<Html.H<Msg>, "div">,
  options: { element?: Html.H<Msg>["div"] } = {},
) => {
  return styledSlot(options.element ?? h.div, "tag-group", ...tagGroupClasses).attr("role", "list");
};

export const Tag = <Msg>(
  h: Pick<Html.H<Msg>, "span">,
  options: { size?: "sm" | "md" | "lg"; disabled?: boolean; element?: Html.H<Msg>["span"] } = {},
) => {
  const { size = "sm", disabled = false } = options;
  return styledSlot(options.element ?? h.span, "tag", tagVariants({ size })).attrs({
    "data-size": size,
    "data-disabled": disabled ? "" : undefined,
  });
};

export const TagCount = <Msg>(
  h: Pick<Html.H<Msg>, "span">,
  options: { size?: "sm" | "md" | "lg"; element?: Html.H<Msg>["span"] } = {},
) => {
  const { size = "sm" } = options;
  return styledSlot(options.element ?? h.span, "tag-count", ...tagCountClasses, countSize[size]);
};

export type TagSize = "sm" | "md" | "lg";
export { tagVariants };
/** Static tag content. Selection and removal belong to controls, outside this markup wrapper. */
export const TagContent = <Msg>(h: Pick<Html.H<Msg>, "span">, options: { size?: TagSize } = {}) =>
  styledSlot(h.span, "tag-content", ...tagContentClasses, contentGap[options.size ?? "sm"]);
