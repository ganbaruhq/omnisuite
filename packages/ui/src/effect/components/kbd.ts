import type { Html } from "@effect/ui/html";
import { styledSlot } from "@omnisuite/ui/effect/lib/styled";
import { kbdClasses, kbdGroupClasses } from "@omnisuite/ui/lib/recipes/kbd";

export const Kbd = <Msg>(
  h: Pick<Html.H<Msg>, "kbd">,
  options: { element?: Html.H<Msg>["kbd"] } = {},
) => {
  return styledSlot(options.element ?? h.kbd, "kbd", ...kbdClasses);
};

export const KbdGroup = <Msg>(
  h: Pick<Html.H<Msg>, "kbd">,
  options: { element?: Html.H<Msg>["kbd"] } = {},
) => {
  return styledSlot(options.element ?? h.kbd, "kbd-group", ...kbdGroupClasses);
};
