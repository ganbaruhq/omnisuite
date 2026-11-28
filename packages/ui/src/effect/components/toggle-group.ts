import type { View } from "@effect/ui";
import type { Html } from "@effect/ui/html";
import { ToggleGroup as KitToggleGroup } from "@effect/ui-kit/ToggleGroup";
import {
  effectToggleGroupClasses as rootClasses,
  effectToggleGroupItemClasses as itemClasses,
} from "@omnisuite/ui/lib/recipes/toggle-group";
import { toggleVariants } from "@omnisuite/ui/lib/recipes/toggle";
import type { ToggleVariant, ToggleSize } from "@omnisuite/ui/effect/components/toggle";
import { restyle, styledSlot } from "@omnisuite/ui/effect/lib/styled";

interface StyleOptions {
  readonly variant?: ToggleVariant;
  readonly size?: ToggleSize;
  readonly spacing?: number;
}

export const ToggleGroup = restyle(KitToggleGroup, (group) => {
  const root = <B extends View.PartTarget<"div">>(element: B, options: StyleOptions = {}) => {
    const { variant = "default", size = "default", spacing = 2 } = options;
    return group.root(
      styledSlot(element, "toggle-group", rootClasses)
        .attr("data-variant", variant)
        .attr("data-size", size)
        .attr("data-spacing", String(spacing))
        .attr("style", `--gap: ${spacing}`),
    );
  };
  const item = <
    B extends View.PartTarget<"button"> & {
      readonly key: (key: string) => View.PartTarget<"button">;
    },
  >(
    options: { readonly element: B; readonly value: string } & StyleOptions,
  ) => {
    const { variant = "default", size = "default", spacing = 2 } = options;
    return group.item({
      element: styledSlot(
        options.element,
        "toggle-group-item",
        itemClasses,
        toggleVariants({ variant, size }),
      )
        .attr("data-variant", variant)
        .attr("data-size", size)
        .attr("data-spacing", String(spacing)),
      value: options.value,
    });
  };
  return {
    ...group,
    root,
    item,
    /** The group and its buttons, sharing variants, size and spacing. */
    control: <Msg>(
      h: Pick<Html.H<Msg>, "div" | "button">,
      options: StyleOptions & {
        readonly items: ReadonlyArray<{ readonly value: string; readonly label: string }>;
      },
    ) =>
      root(h.div, options).children(
        options.items.map(({ value, label }) =>
          item({ ...options, element: h.button, value }).children(label),
        ),
      ),
  };
});
