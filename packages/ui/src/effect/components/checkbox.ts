import type { Html } from "@effect/ui/html";
import { Checkbox as KitCheckbox } from "@effect/ui-kit/Checkbox";
import { checkboxClasses, checkboxIndicatorClasses } from "@omnisuite/ui/lib/recipes/checkbox";
import { Icon } from "@omnisuite/ui/effect/lib/icons";
import { restyle, stylePart } from "@omnisuite/ui/effect/lib/styled";

/**
 * The kit's `Checkbox` with our styles on `root` and `indicator`, and `box`, which draws both
 * with the check icon:
 *
 * ```ts
 * Checkbox(h, {
 *   props: { checked: model.agreed },
 *   onEmit: { Toggled: ({ checked }) => Message.ToggledAgreed({ checked }) },
 *   view: (checkbox) => checkbox.box(h),
 * })
 * ```
 */
export const Checkbox = restyle(KitCheckbox, (checkbox) => {
  const root = stylePart(checkbox.root, "checkbox", checkboxClasses);
  // The kit draws the indicator in both states, where Base UI unmounts it.
  const indicator = stylePart(
    checkbox.indicator,
    "checkbox-indicator",
    checkboxIndicatorClasses,
    "data-unchecked:hidden",
  );
  return {
    ...checkbox,
    root,
    indicator,
    /** The root on `element` (`h.button` by default) with the indicator and its icon inside. */
    box: <Msg>(
      h: Pick<Html.H<Msg>, "button" | "span" | "svg" | "path">,
      element: Parameters<typeof root>[0] = h.button,
    ) => root(element).children(indicator(h.span).children(Icon(h, "check"))),
  };
});
