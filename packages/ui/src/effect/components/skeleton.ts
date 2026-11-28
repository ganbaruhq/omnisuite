import type { Html } from "@effect/ui/html";
import { styledSlot } from "@omnisuite/ui/effect/lib/styled";
import { skeletonClasses } from "@omnisuite/ui/lib/recipes/skeleton";

export const Skeleton = <Msg>(
  h: Pick<Html.H<Msg>, "div">,
  options: { element?: Html.H<Msg>["div"] } = {},
) => {
  return styledSlot(options.element ?? h.div, "skeleton", ...skeletonClasses);
};
