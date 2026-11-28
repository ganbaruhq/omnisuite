import type { Html } from "@effect/ui/html";
import { styledSlot } from "@omnisuite/ui/effect/lib/styled";
import {
  buttonGroupTextClasses,
  buttonGroupVariants,
} from "@omnisuite/ui/lib/recipes/button-group";
import { Separator } from "@omnisuite/ui/effect/components/separator";
import { buttonGroupSeparatorClasses } from "@omnisuite/ui/lib/recipes/button-group";

export const ButtonGroupText = <Msg>(
  h: Pick<Html.H<Msg>, "div">,
  options: { element?: Html.H<Msg>["div"] } = {},
) => {
  return styledSlot(options.element ?? h.div, "button-group-text", ...buttonGroupTextClasses);
};

export const ButtonGroup = <Msg>(
  h: Pick<Html.H<Msg>, "div">,
  options: { orientation?: "horizontal" | "vertical"; element?: Html.H<Msg>["div"] } = {},
) => {
  const { orientation = "horizontal" } = options;
  return styledSlot(
    options.element ?? h.div,
    "button-group",
    buttonGroupVariants({ orientation }),
  ).attrs({ "data-orientation": orientation, role: "group" });
};

export const ButtonGroupSeparator = <Msg>(
  h: Parameters<typeof Separator<Msg>>[0],
  options: Parameters<typeof Separator<Msg>>[1] = {},
) =>
  styledSlot(
    Separator(h, { ...options, props: { orientation: "vertical", ...options.props } }),
    "button-group-separator",
    ...buttonGroupSeparatorClasses,
  );
