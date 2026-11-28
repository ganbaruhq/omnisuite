import type { Html } from "@effect/ui/html";
import { styledSlot } from "@omnisuite/ui/effect/lib/styled";
import {
  layerCardClasses,
  layerCardPrimaryClasses,
  layerCardSecondaryClasses,
} from "@omnisuite/ui/lib/recipes/layer-card";

export const LayerCard = <Msg>(
  h: Pick<Html.H<Msg>, "div">,
  options: { element?: Html.H<Msg>["div"] } = {},
) => {
  return styledSlot(options.element ?? h.div, "layer-card", ...layerCardClasses);
};

export const LayerCardPrimary = <Msg>(
  h: Pick<Html.H<Msg>, "div">,
  options: { element?: Html.H<Msg>["div"] } = {},
) => {
  return styledSlot(options.element ?? h.div, "layer-card-primary", ...layerCardPrimaryClasses);
};

export const LayerCardSecondary = <Msg>(
  h: Pick<Html.H<Msg>, "div">,
  options: { element?: Html.H<Msg>["div"] } = {},
) => {
  return styledSlot(options.element ?? h.div, "layer-card-secondary", ...layerCardSecondaryClasses);
};
