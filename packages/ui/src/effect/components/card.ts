import type { Html } from "@effect/ui/html";
import { styledSlot } from "@omnisuite/ui/effect/lib/styled";
import {
  cardClasses,
  cardHeaderClasses,
  cardTitleClasses,
  cardDescriptionClasses,
  cardActionClasses,
  cardContentClasses,
  cardFooterClasses,
} from "@omnisuite/ui/lib/recipes/card";

export const Card = <Msg>(
  h: Pick<Html.H<Msg>, "div">,
  options: { size?: "default" | "sm"; element?: Html.H<Msg>["div"] } = {},
) => {
  const { size = "default" } = options;
  return styledSlot(options.element ?? h.div, "card", ...cardClasses).attrs({ "data-size": size });
};

export const CardHeader = <Msg>(
  h: Pick<Html.H<Msg>, "div">,
  options: { element?: Html.H<Msg>["div"] } = {},
) => {
  return styledSlot(options.element ?? h.div, "card-header", ...cardHeaderClasses);
};

export const CardTitle = <Msg>(
  h: Pick<Html.H<Msg>, "div">,
  options: { element?: Html.H<Msg>["div"] } = {},
) => {
  return styledSlot(options.element ?? h.div, "card-title", ...cardTitleClasses);
};

export const CardDescription = <Msg>(
  h: Pick<Html.H<Msg>, "div">,
  options: { element?: Html.H<Msg>["div"] } = {},
) => {
  return styledSlot(options.element ?? h.div, "card-description", ...cardDescriptionClasses);
};

export const CardAction = <Msg>(
  h: Pick<Html.H<Msg>, "div">,
  options: { element?: Html.H<Msg>["div"] } = {},
) => {
  return styledSlot(options.element ?? h.div, "card-action", ...cardActionClasses);
};

export const CardContent = <Msg>(
  h: Pick<Html.H<Msg>, "div">,
  options: { element?: Html.H<Msg>["div"] } = {},
) => {
  return styledSlot(options.element ?? h.div, "card-content", ...cardContentClasses);
};

export const CardFooter = <Msg>(
  h: Pick<Html.H<Msg>, "div">,
  options: { element?: Html.H<Msg>["div"] } = {},
) => {
  return styledSlot(options.element ?? h.div, "card-footer", ...cardFooterClasses);
};
