import type { View } from "@effect/ui";
import type { Html } from "@effect/ui/html";
import { ToggleGroup as KitToggleGroup } from "@effect/ui-kit/ToggleGroup";
import { toggleVariants } from "@omnisuite/ui/lib/recipes/toggle";
import type { ToggleVariant, ToggleSize } from "@omnisuite/ui/effect/components/toggle";
import { restyle, styledSlot } from "@omnisuite/ui/effect/lib/styled";

const rootClasses =
  "group/toggle-group flex w-fit flex-row items-center gap-[--spacing(var(--gap))] rounded-md data-[size=lg]:rounded-lg data-[size=xs]:rounded-[min(var(--radius-md),8px)] data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch";

const itemClasses =
  "shrink-0 group-data-[spacing=0]/toggle-group:rounded-none group-data-[spacing=0]/toggle-group:px-2 focus:z-10 focus-visible:z-10 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-end]:pr-1.5 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-start]:pl-1.5 group-data-[orientation=horizontal]/toggle-group:data-[spacing=0]:first:rounded-l-md group-data-[orientation=vertical]/toggle-group:data-[spacing=0]:first:rounded-t-md group-data-[orientation=horizontal]/toggle-group:data-[spacing=0]:last:rounded-r-md group-data-[orientation=vertical]/toggle-group:data-[spacing=0]:last:rounded-b-md group-data-[orientation=horizontal]/toggle-group:data-[spacing=0]:data-[variant=outline]:border-l-0 group-data-[orientation=vertical]/toggle-group:data-[spacing=0]:data-[variant=outline]:border-t-0 group-data-[orientation=horizontal]/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-l group-data-[orientation=vertical]/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-t";

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
