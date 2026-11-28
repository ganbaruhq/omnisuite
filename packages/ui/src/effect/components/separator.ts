import {
  Separator as KitSeparator,
  type SeparatorElement,
  type SeparatorProps,
} from "@effect/ui-kit/Separator";
import { styledSlot } from "@omnisuite/ui/effect/lib/styled";
import { separatorClasses } from "@omnisuite/ui/lib/recipes/separator";

/** Kit semantics plus Base UI orientation aliases used by the shared recipe. */
export const Separator = <Msg, R = never>(
  h: { readonly div: SeparatorElement<Msg> },
  options: {
    readonly element?: SeparatorElement<Msg, R> | undefined;
    readonly props?: SeparatorProps | undefined;
  } = {},
) => {
  const orientation = options.props?.orientation ?? "horizontal";
  return styledSlot(KitSeparator(h, options), "separator", separatorClasses).attrs({
    "data-horizontal": orientation === "horizontal" ? "" : undefined,
    "data-vertical": orientation === "vertical" ? "" : undefined,
  });
};
