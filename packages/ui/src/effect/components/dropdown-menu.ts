import type { View } from "@effect/ui";
import type { Html } from "@effect/ui/html";
import { Menu as KitMenu } from "@effect/ui-kit/Menu";
import {
  dropdownMenuChoiceItemClasses,
  dropdownMenuContentClasses,
  dropdownMenuItemClasses,
  dropdownMenuItemIndicatorClasses,
  dropdownMenuLabelClasses,
  dropdownMenuPositionerClasses,
  dropdownMenuSeparatorClasses,
  dropdownMenuShortcutClasses,
  dropdownMenuSubContentClasses,
  dropdownMenuSubTriggerClasses,
} from "@omnisuite/ui/lib/recipes/dropdown-menu";
import { Icon } from "@omnisuite/ui/effect/lib/icons";
import {
  popoverReset,
  restyle,
  styleElementPart,
  stylePart,
  styledSlot,
} from "@omnisuite/ui/effect/lib/styled";

// Base UI focuses the highlighted item, and React's recipes style `focus:`. The kit marks it
// `data-highlighted`, so the items get the same look on that.
const itemHighlighted =
  "data-highlighted:bg-accent data-highlighted:text-accent-foreground not-data-[variant=destructive]:data-highlighted:**:text-accent-foreground data-[variant=destructive]:data-highlighted:bg-destructive/10 data-[variant=destructive]:data-highlighted:text-destructive dark:data-[variant=destructive]:data-highlighted:bg-destructive/20";
const choiceItemHighlighted =
  "data-highlighted:bg-accent data-highlighted:text-accent-foreground data-highlighted:**:text-accent-foreground";
const subTriggerHighlighted =
  "data-highlighted:bg-accent data-highlighted:text-accent-foreground not-data-[variant=destructive]:data-highlighted:**:text-accent-foreground";
const shortcutHighlighted = "group-data-highlighted/dropdown-menu-item:text-accent-foreground";

export type DropdownMenuItemVariant = "default" | "destructive";

type Drawing = "div" | "span" | "svg" | "path";

/** An item's element, which the kit keys with the item's value. */
type ItemElement = View.PartTarget<"div"> & {
  readonly key: (key: string) => View.PartTarget<"div">;
};

/** Our `data-inset` and `data-variant`, set as React's items set them. */
const marked = <B>(
  element: B,
  marks: { readonly inset?: boolean; readonly variant?: string },
): B => {
  let builder = element as unknown as View.ElementBuilder<unknown> & {
    attr: (name: string, value: string | undefined) => View.ElementBuilder<unknown>;
  };
  if (marks.variant !== undefined) builder = builder.attr("data-variant", marks.variant) as never;
  if (marks.inset === true) builder = builder.attr("data-inset", "") as never;
  return builder as unknown as B;
};

const Styled = restyle(KitMenu, (menu) => {
  const positioner = stylePart(
    menu.positioner,
    "dropdown-menu-positioner",
    popoverReset,
    dropdownMenuPositionerClasses,
  );
  // React's sub content is its content with more classes, under its own slot.
  const popup = menu.nested
    ? stylePart(
        menu.popup,
        "dropdown-menu-sub-content",
        dropdownMenuContentClasses,
        dropdownMenuSubContentClasses,
      )
    : stylePart(menu.popup, "dropdown-menu-content", dropdownMenuContentClasses);
  const styledItem = styleElementPart(
    menu.item,
    "dropdown-menu-item",
    dropdownMenuItemClasses,
    itemHighlighted,
  );
  const checkboxItem = styleElementPart(
    menu.checkboxItem,
    "dropdown-menu-checkbox-item",
    dropdownMenuChoiceItemClasses,
    choiceItemHighlighted,
  );
  const radioItem = styleElementPart(
    menu.radioItem,
    "dropdown-menu-radio-item",
    dropdownMenuChoiceItemClasses,
    choiceItemHighlighted,
  );
  const checkboxItemIndicator = styleElementPart(
    menu.checkboxItemIndicator,
    "dropdown-menu-checkbox-item-indicator",
    dropdownMenuItemIndicatorClasses,
  );
  const radioItemIndicator = styleElementPart(
    menu.radioItemIndicator,
    "dropdown-menu-radio-item-indicator",
    dropdownMenuItemIndicatorClasses,
  );
  const subTriggerItem = styleElementPart(
    menu.item,
    "dropdown-menu-sub-trigger",
    dropdownMenuSubTriggerClasses,
    subTriggerHighlighted,
  );
  const groupLabel = styleElementPart(
    menu.groupLabel,
    "dropdown-menu-label",
    dropdownMenuLabelClasses,
  );

  return {
    ...menu,
    trigger: styleElementPart(menu.trigger, "dropdown-menu-trigger"),
    positioner,
    popup,
    /** An action, `default` or `destructive` as React's `variant`, indented with `inset`. */
    item: <B extends ItemElement>(options: {
      readonly element: B;
      readonly value: string;
      readonly closeOnClick?: boolean;
      readonly variant?: DropdownMenuItemVariant;
      readonly inset?: boolean;
    }) => {
      const { variant = "default", inset, ...rest } = options;
      return styledItem({
        ...rest,
        element: marked(options.element, inset === undefined ? { variant } : { variant, inset }),
      });
    },
    checkboxItem: <B extends ItemElement>(options: {
      readonly element: B;
      readonly value: string;
      readonly closeOnClick?: boolean;
      readonly inset?: boolean;
    }) => {
      const { inset, ...rest } = options;
      return checkboxItem({
        ...rest,
        element: marked(options.element, inset === undefined ? {} : { inset }),
      });
    },
    radioItem: <B extends ItemElement>(options: {
      readonly element: B;
      readonly value: string;
      readonly closeOnClick?: boolean;
      readonly inset?: boolean;
    }) => {
      const { inset, ...rest } = options;
      return radioItem({
        ...rest,
        element: marked(options.element, inset === undefined ? {} : { inset }),
      });
    },
    checkboxItemIndicator,
    radioItemIndicator,
    group: styleElementPart(menu.group, "dropdown-menu-group"),
    /** React's `DropdownMenuLabel`: the label of a `group`, indented with `inset`. */
    label: <B extends View.PartTarget<"div">>(options: {
      readonly element: B;
      readonly group: string;
      readonly inset?: boolean;
    }) => {
      const { inset, ...rest } = options;
      return groupLabel({
        ...rest,
        element: marked(options.element, inset === undefined ? {} : { inset }),
      });
    },
    radioGroup: stylePart(menu.radioGroup, "dropdown-menu-radio-group"),
    separator: stylePart(menu.separator, "dropdown-menu-separator", dropdownMenuSeparatorClasses),
    /** The keyboard shortcut at the end of an item. */
    shortcut: <B>(builder: B) =>
      styledSlot(
        builder,
        "dropdown-menu-shortcut",
        dropdownMenuShortcutClasses,
        shortcutHighlighted,
      ),
    /** The positioner and popup around `children`. */
    content: <Msg, C extends View.Children<Msg>>(h: Pick<Html.H<Msg>, "div">, children: C) =>
      positioner(h.div).children(popup(h.div).children(children)),
    /** A checkbox item with its label and the check shown while it's checked. */
    checkboxOption: <Msg>(
      h: Pick<Html.H<Msg>, Drawing>,
      option: { readonly value: string; readonly label: string; readonly inset?: boolean },
    ) => {
      const { label, ...rest } = option;
      return checkboxItem({
        ...rest,
        element: marked(h.div, rest.inset === undefined ? {} : { inset: rest.inset }),
      }).children(
        checkboxItemIndicator({ element: h.span, value: option.value })?.children(Icon(h, "check")),
        label,
      );
    },
    /** A radio item with its label and the check shown while it's checked. */
    radioOption: <Msg>(
      h: Pick<Html.H<Msg>, Drawing>,
      option: { readonly value: string; readonly label: string; readonly inset?: boolean },
    ) => {
      const { label, ...rest } = option;
      return radioItem({
        ...rest,
        element: marked(h.div, rest.inset === undefined ? {} : { inset: rest.inset }),
      }).children(
        radioItemIndicator({ element: h.span, value: option.value })?.children(Icon(h, "check")),
        label,
      );
    },
    /**
     * The item of this menu that opens a submenu, with React's chevron after `children`. Pass the
     * submenu's `submenuTrigger` as the element:
     * `menu.subTrigger(h, { element: share.submenuTrigger(h.div), value: "share" }, ["Share"])`.
     */
    subTrigger: <Msg, C extends View.Children<Msg>>(
      h: Pick<Html.H<Msg>, "svg" | "path">,
      options: {
        readonly element: ReturnType<Html.H<Msg>["div"]["attr"]>;
        readonly value: string;
        readonly inset?: boolean;
      },
      children: C,
    ) => {
      const { inset, ...rest } = options;
      return subTriggerItem({
        ...rest,
        element: marked(options.element, inset === undefined ? {} : { inset }),
      }).children(children, Icon(h, "chevron-right").class("ml-auto"));
    },
  };
});

const rootDefaults = { side: "bottom", align: "start", sideOffset: 4, alignOffset: 0 } as const;
const submenuDefaults = { side: "right", align: "start", sideOffset: 0, alignOffset: -3 } as const;

/**
 * React's `DropdownMenu`, on the kit's `Menu`: called as the kit's, with our styled parts in
 * `view`, React's placement (below the trigger, at its start, 4px away; a submenu to the right of
 * its item), and convenience parts that draw what React's composite components do: `content`,
 * `checkboxOption`, `radioOption`, `subTrigger` and `shortcut`. `item` takes React's `variant`
 * and `inset`. A submenu is another `DropdownMenu` with `parentItem`, as in the kit.
 *
 * ```ts
 * DropdownMenu(h, {
 *   props: { open: model.open, items: [{ value: "rename", label: "Rename" }] },
 *   onEmit: { ... },
 *   view: (menu) =>
 *     h.div(
 *       menu.trigger({ element: Button(h, { variant: "ghost" }) }).children("Actions"),
 *       menu.content(h, [menu.item({ element: h.div, value: "rename" }).children("Rename")]),
 *     ),
 * })
 * ```
 */
export const DropdownMenu: typeof Styled = Object.assign(
  (h: never, options: { readonly props: { readonly parentItem?: string | undefined } }) =>
    (Styled as unknown as (h: never, options: unknown) => unknown)(h, {
      ...options,
      props: {
        ...(options.props.parentItem === undefined ? rootDefaults : submenuDefaults),
        ...options.props,
      },
    }),
  { kit: KitMenu },
) as unknown as typeof Styled;
