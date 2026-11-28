import type { ToggleElement, ToggleProps } from "@effect/ui-kit/Toggle";
import { Toggle as KitToggle } from "@effect/ui-kit/Toggle";
import type { VariantProps } from "class-variance-authority";
import { toggleVariants } from "@omnisuite/ui/lib/recipes/toggle";
import { styledSlot } from "@omnisuite/ui/effect/lib/styled";

export type ToggleVariant = NonNullable<VariantProps<typeof toggleVariants>["variant"]>;
export type ToggleSize = NonNullable<VariantProps<typeof toggleVariants>["size"]>;

export const Toggle = <Msg, R = never>(
  h: { readonly button: ToggleElement<Msg> },
  options: {
    readonly element?: ToggleElement<Msg, R>;
    readonly props: ToggleProps;
    readonly onToggle?: (event: { readonly pressed: boolean }) => NoInfer<Msg> | undefined;
    readonly variant?: ToggleVariant;
    readonly size?: ToggleSize;
  },
) => {
  const { variant = "default", size = "default" } = options;
  return styledSlot(KitToggle(h, options), "toggle", toggleVariants({ variant, size })).attrs({
    "data-variant": variant,
    "data-size": size,
  });
};

export { toggleVariants };
