import type { Html } from "@effect/ui/html";
import { styledSlot } from "@omnisuite/ui/effect/lib/styled";
import { badgeDotClasses, badgeImageClasses, badgeVariants } from "@omnisuite/ui/lib/recipes/badge";
import type { VariantProps } from "class-variance-authority";
import type { View } from "@effect/ui";
import { Icon } from "@omnisuite/ui/effect/lib/icons";
import { badgeWithButtonClasses } from "@omnisuite/ui/lib/recipes/badge";

export const BadgeDot = <Msg>(
  h: Pick<Html.H<Msg>, "span">,
  options: { pulse?: boolean; element?: Html.H<Msg>["span"] } = {},
) => {
  const { pulse = false } = options;
  return styledSlot(
    options.element ?? h.span,
    "badge-dot",
    ...badgeDotClasses,
    pulse && "animate-pulse motion-reduce:animate-none",
  ).attrs({ "aria-hidden": "true" });
};

export const BadgeImage = <Msg>(
  h: Pick<Html.H<Msg>, "img">,
  options: { element?: Html.H<Msg>["img"] } = {},
) => {
  return styledSlot(options.element ?? h.img, "badge-image", ...badgeImageClasses);
};

export const Badge = <Msg>(
  h: Pick<Html.H<Msg>, "span">,
  options: {
    variant?: NonNullable<VariantProps<typeof badgeVariants>["variant"]>;
    color?: NonNullable<VariantProps<typeof badgeVariants>["color"]>;
    size?: NonNullable<VariantProps<typeof badgeVariants>["size"]>;
    element?: Html.H<Msg>["span"];
  } = {},
) => {
  const { variant = "pill-color", color = "gray", size = "md" } = options;
  return styledSlot(
    options.element ?? h.span,
    "badge",
    badgeVariants({ variant, color, size }),
  ).attrs({ "data-variant": variant, "data-color": color, "data-size": size });
};

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;
export type BadgeColor = NonNullable<VariantProps<typeof badgeVariants>["color"]>;
export type BadgeSize = NonNullable<VariantProps<typeof badgeVariants>["size"]>;
export { badgeVariants };
export const BadgeWithButton = <Msg>(
  h: Pick<Html.H<Msg>, "span" | "button" | "svg" | "path">,
  options: {
    readonly variant?: BadgeVariant;
    readonly color?: BadgeColor;
    readonly size?: BadgeSize;
    readonly buttonLabel: string;
    readonly onPress?: NoInfer<Msg>;
    readonly disabled?: boolean;
    readonly children?: ReadonlyArray<View.Input<Msg>>;
  },
) => {
  const button = styledSlot(h.button, "badge-button", ...badgeWithButtonClasses)
    .attrs({ type: "button", "aria-label": options.buttonLabel })
    .disabled(options.disabled ?? false)
    .children(Icon(h, "x").attrs({ "stroke-width": "3" }).class("size-3"));
  return Badge(h, options).children(
    ...(options.children ?? []),
    options.onPress === undefined ? button : button.on("click", options.onPress),
  );
};
