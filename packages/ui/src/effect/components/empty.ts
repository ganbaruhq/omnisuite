import type { Html } from "@effect/ui/html";
import { styledSlot } from "@omnisuite/ui/effect/lib/styled";
import {
  emptyClasses,
  emptyHeaderClasses,
  emptyTitleClasses,
  emptyDescriptionClasses,
  emptyContentClasses,
  emptyMediaVariants,
} from "@omnisuite/ui/lib/recipes/empty";
import type { VariantProps } from "class-variance-authority";

export const Empty = <Msg>(
  h: Pick<Html.H<Msg>, "div">,
  options: { element?: Html.H<Msg>["div"] } = {},
) => {
  return styledSlot(options.element ?? h.div, "empty", ...emptyClasses);
};

export const EmptyHeader = <Msg>(
  h: Pick<Html.H<Msg>, "div">,
  options: { element?: Html.H<Msg>["div"] } = {},
) => {
  return styledSlot(options.element ?? h.div, "empty-header", ...emptyHeaderClasses);
};

export const EmptyTitle = <Msg>(
  h: Pick<Html.H<Msg>, "div">,
  options: { element?: Html.H<Msg>["div"] } = {},
) => {
  return styledSlot(options.element ?? h.div, "empty-title", ...emptyTitleClasses);
};

export const EmptyDescription = <Msg>(
  h: Pick<Html.H<Msg>, "div">,
  options: { element?: Html.H<Msg>["div"] } = {},
) => {
  return styledSlot(options.element ?? h.div, "empty-description", ...emptyDescriptionClasses);
};

export const EmptyContent = <Msg>(
  h: Pick<Html.H<Msg>, "div">,
  options: { element?: Html.H<Msg>["div"] } = {},
) => {
  return styledSlot(options.element ?? h.div, "empty-content", ...emptyContentClasses);
};

export const EmptyMedia = <Msg>(
  h: Pick<Html.H<Msg>, "div">,
  options: {
    variant?: NonNullable<VariantProps<typeof emptyMediaVariants>["variant"]>;
    element?: Html.H<Msg>["div"];
  } = {},
) => {
  const { variant = "default" } = options;
  return styledSlot(options.element ?? h.div, "empty-icon", emptyMediaVariants({ variant })).attrs({
    "data-variant": variant,
  });
};
