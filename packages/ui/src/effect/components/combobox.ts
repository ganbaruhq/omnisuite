import type { View } from "@effect/ui";
import type { Html } from "@effect/ui/html";
import { Combobox as KitCombobox } from "@effect/ui-kit/Combobox";
import * as classes from "@omnisuite/ui/lib/recipes/combobox";
import { inputClasses } from "@omnisuite/ui/lib/recipes/input";
import { buttonVariants } from "@omnisuite/ui/lib/recipes/button";
import type { ControlSize } from "@omnisuite/ui/lib/recipes/control";
import { labelClasses } from "@omnisuite/ui/lib/recipes/label";
import { fieldLabelClasses } from "@omnisuite/ui/lib/recipes/field";
import { Icon } from "@omnisuite/ui/effect/lib/icons";
import {
  popoverReset,
  restyle,
  stylePart,
  styleElementPart,
  styledSlot,
} from "@omnisuite/ui/effect/lib/styled";

type Drawing = "div" | "span" | "svg" | "path";

const iconButton = <Msg>(h: Pick<Html.H<Msg>, "button">) =>
  styledSlot(
    h.button,
    "input-group-button",
    buttonVariants({ variant: "ghost", size: "icon-xs" }),
  ).attrs({ "data-variant": "ghost", "data-size": "icon-xs" });

export const Combobox = restyle(
  KitCombobox,
  (combo) => {
    const inputGroup = stylePart(
      combo.inputGroup,
      "input-group",
      inputClasses,
      "group/input-group relative flex w-full items-center p-0 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 has-aria-invalid:border-destructive has-aria-invalid:ring-2 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40",
    );
    const input = stylePart(
      combo.input,
      "input-group-control",
      inputClasses,
      "h-full flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 [--control-px:inherit] focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent",
    );
    const trigger = stylePart(
      combo.trigger,
      "combobox-trigger",
      classes.comboboxTriggerClasses,
      classes.comboboxTriggerButtonClasses,
    );
    const positioner = stylePart(
      combo.positioner,
      "combobox-positioner",
      popoverReset,
      classes.comboboxPositionerClasses,
    );
    const popup = stylePart(
      combo.popup,
      "combobox-content",
      classes.comboboxContentClasses,
      "max-h-(--available-height,24rem)",
    );
    const list = stylePart(combo.list, "combobox-list", classes.comboboxListClasses);
    const item = styleElementPart(combo.item, "combobox-item", classes.comboboxItemClasses);
    const itemIndicator = styleElementPart(
      combo.itemIndicator,
      "combobox-item-indicator",
      classes.comboboxItemIndicatorClasses,
    );
    const clear = styleElementPart(
      combo.clear,
      "combobox-clear",
      buttonVariants({ variant: "ghost", size: "icon-xs" }),
      "flex items-center gap-2 rounded-md text-xs/relaxed shadow-none size-6 p-0 has-[>svg]:p-0",
    );
    const chip = styleElementPart(combo.chip, "combobox-chip", classes.comboboxChipClasses);
    const chipRemove = styleElementPart(
      combo.chipRemove,
      "combobox-chip-remove",
      buttonVariants({ variant: "ghost", size: "icon-xs" }),
      classes.comboboxChipRemoveClasses,
    );
    const empty = stylePart(combo.empty, "combobox-empty", classes.comboboxEmptyClasses, "flex");
    return {
      ...combo,
      label: stylePart(combo.label, "combobox-field-label", labelClasses, ...fieldLabelClasses),
      value: stylePart(combo.value, "combobox-value"),
      inputGroup,
      input,
      trigger,
      icon: stylePart(combo.icon, "combobox-icon", classes.comboboxTriggerIconClasses),
      clear,
      positioner,
      popup,
      list,
      item,
      itemIndicator,
      empty,
      group: styleElementPart(combo.group, "combobox-group"),
      groupLabel: styleElementPart(
        combo.groupLabel,
        "combobox-label",
        classes.comboboxLabelClasses,
      ),
      separator: stylePart(combo.separator, "combobox-separator", classes.comboboxSeparatorClasses),
      chips: stylePart(combo.chips, "combobox-chips", classes.comboboxChipsClasses),
      chip,
      chipRemove,
      chipsInput: stylePart(combo.input, "combobox-chip-input", classes.comboboxChipInputClasses),
      /** Input, toggle button and optional clear button, as React's ComboboxInput. */
      control: <Msg>(
        h: Pick<Html.H<Msg>, Drawing | "input" | "button">,
        options: {
          readonly label: string;
          readonly element?: ReturnType<Html.H<Msg>["input"]["attr"]>;
          readonly size?: ControlSize;
          readonly showTrigger?: boolean;
          readonly showClear?: boolean;
        },
      ) =>
        inputGroup(h.div)
          .attr("data-size", options.size ?? "default")
          .children(
            input(options.element ?? h.input).attr("aria-label", options.label),
            styledSlot(
              h.div,
              "input-group-addon",
              "order-last flex items-center pr-(--control-px) has-[>button]:mr-[-0.275rem]",
            )
              .attr("data-align", "inline-end")
              .children(
                options.showTrigger === false
                  ? undefined
                  : trigger(iconButton(h))
                      .attr("aria-label", `Show ${options.label} options`)
                      .children(Icon(h, "chevron-down")),
                options.showClear
                  ? clear({
                      element: iconButton(h),
                    })
                      ?.attr("aria-label", `Clear ${options.label}`)
                      .children(Icon(h, "x"))
                  : undefined,
              ),
          ),
      content: <Msg, C extends View.Children<Msg>>(h: Pick<Html.H<Msg>, Drawing>, children: C) =>
        positioner(h.div).children(
          popup(h.div).children(
            list(h.div).children(children),
            empty(h.div)?.children("No results found."),
          ),
        ),
      option: <Msg>(
        h: Pick<Html.H<Msg>, Drawing>,
        option: { readonly value: string; readonly label: string },
      ) =>
        item({ element: h.div, value: option.value }).children(
          option.label,
          itemIndicator({ element: h.span, value: option.value })?.children(Icon(h, "check")),
        ),
      chipWithRemove: <Msg>(
        h: Pick<Html.H<Msg>, Drawing | "button">,
        option: { readonly value: string; readonly label: string },
      ) =>
        chip({ element: h.div, value: option.value }).children(
          option.label,
          chipRemove({
            element: iconButton(h),
            value: option.value,
          })
            .attr("aria-label", `Remove ${option.label}`)
            .children(Icon(h, "x")),
        ),
    };
  },
  { sideOffset: 6, align: "start" },
);
