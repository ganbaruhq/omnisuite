import type { View } from "@effect/ui";
import type { Html } from "@effect/ui/html";
import { Select as KitSelect } from "@effect/ui-kit/Select";
import {
  selectContentClasses,
  selectGroupClasses,
  selectItemClasses,
  selectItemIndicatorClasses,
  selectItemTextClasses,
  selectLabelClasses,
  selectScrollDownClasses,
  selectScrollUpClasses,
  selectSeparatorClasses,
  selectTriggerClasses,
  selectValueClasses,
} from "@omnisuite/ui/lib/recipes/select";
import { labelClasses } from "@omnisuite/ui/lib/recipes/label";
import { Icon } from "@omnisuite/ui/effect/lib/icons";
import {
  popoverReset,
  restyle,
  styleElementPart,
  stylePart,
  styledSlot,
} from "@omnisuite/ui/effect/lib/styled";

export type SelectSize = "sm" | "default";

// Base UI focuses the highlighted item, and React's recipe styles `focus:`. The kit marks it
// `data-highlighted`, so the item gets the same look on that.
const itemHighlighted =
  "data-highlighted:bg-accent data-highlighted:text-accent-foreground not-data-[variant=destructive]:data-highlighted:**:text-accent-foreground";

type Drawing = "div" | "span" | "svg" | "path";

/**
 * The kit's `Select` with our styles, and convenience parts that draw what React's
 * `SelectTrigger`, `SelectContent` and `SelectItem` do:
 *
 * ```ts
 * Select(h, {
 *   props: { open: model.open, value: model.kind, items: kinds },
 *   onEmit: { ... },
 *   view: (select) =>
 *     h.div(
 *       select.control(h),
 *       select.content(h, kinds.map((kind) => select.option(h, kind))),
 *     ),
 * })
 * ```
 */
export const Select = restyle(KitSelect, (select) => {
  const trigger = <B extends View.PartTarget<"button">>(
    builder: B,
    size: SelectSize = "default",
  ): ReturnType<B["attr"]> =>
    select.trigger(
      styledSlot(builder, "select-trigger", selectTriggerClasses).attr(
        "data-size",
        size,
      ) as unknown as B,
    );
  const value = stylePart(select.value, "select-value", selectValueClasses);
  const icon = stylePart(
    select.icon,
    "select-icon",
    "pointer-events-none text-muted-foreground [&_svg]:size-3.5",
  );
  const positioner = stylePart(
    select.positioner,
    "select-positioner",
    popoverReset,
    "isolate z-50",
  );
  const popup = <B extends View.PartTarget<"div">>(builder: B): ReturnType<B["attr"]> =>
    select.popup(
      styledSlot(builder, "select-content", selectContentClasses).attr(
        "data-align-trigger",
        String(select.alignedWithTrigger),
      ) as unknown as B,
    );
  const item = styleElementPart(select.item, "select-item", selectItemClasses, itemHighlighted);
  const itemText = stylePart(select.itemText, "select-item-text", selectItemTextClasses);
  const itemIndicator = styleElementPart(
    select.itemIndicator,
    "select-item-indicator",
    selectItemIndicatorClasses,
  );
  const scrollUpArrow = styleElementPart(
    select.scrollUpArrow,
    "select-scroll-up-button",
    selectScrollUpClasses,
  );
  const scrollDownArrow = styleElementPart(
    select.scrollDownArrow,
    "select-scroll-down-button",
    selectScrollDownClasses,
  );
  return {
    ...select,
    label: stylePart(select.label, "select-label", labelClasses),
    trigger,
    value,
    icon,
    positioner,
    popup,
    item,
    itemText,
    itemIndicator,
    group: styleElementPart(select.group, "select-group", selectGroupClasses),
    groupLabel: styleElementPart(select.groupLabel, "select-group-label", selectLabelClasses),
    separator: stylePart(select.separator, "select-separator", selectSeparatorClasses),
    scrollUpArrow,
    scrollDownArrow,
    /** The trigger on `element` (`h.button` by default) with the value and the selector icon. */
    control: <Msg>(
      h: Pick<Html.H<Msg>, "button" | "span" | "svg" | "path">,
      options: { readonly element?: View.PartTarget<"button">; readonly size?: SelectSize } = {},
    ) =>
      trigger((options.element ?? h.button) as Html.H<Msg>["button"], options.size).children(
        value(h.span),
        icon(h.span).children(Icon(h, "selector")),
      ),
    /** The positioner and popup around `children`, with the scroll arrows. */
    content: <Msg, C extends View.Children<Msg>>(h: Pick<Html.H<Msg>, Drawing>, children: C) =>
      positioner(h.div).children(
        popup(h.div).children(
          scrollUpArrow({ element: h.div })?.children(Icon(h, "chevron-up")),
          select.list(h.div).children(children),
          scrollDownArrow({ element: h.div })?.children(Icon(h, "chevron-down")),
        ),
      ),
    /** One item with its label and the check shown while it's selected. */
    option: <Msg>(
      h: Pick<Html.H<Msg>, Drawing>,
      option: { readonly value: string; readonly label: string },
    ) =>
      item({ element: h.div, value: option.value }).children(
        itemText(h.div).children(option.label),
        itemIndicator({ element: h.span, value: option.value })?.children(Icon(h, "check")),
      ),
  };
});
