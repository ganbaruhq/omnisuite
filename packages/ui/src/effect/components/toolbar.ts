import type { View } from "@effect/ui";
import { Toolbar as KitToolbar } from "@effect/ui-kit/Toolbar";
import { buttonVariants } from "@omnisuite/ui/lib/recipes/button";
import { toolbarClasses } from "@omnisuite/ui/lib/recipes/toolbar";
import type { ButtonSize, ButtonVariant } from "@omnisuite/ui/effect/components/button";
import { restyle, styled, stylePart } from "@omnisuite/ui/effect/lib/styled";

/**
 * React's `Toolbar`, the joined control strip, on the kit's, which adds `role="toolbar"` and
 * moves focus between its items with the arrow keys, Home and End. Called as the kit's: every
 * item is declared in `items` and drawn through a part. `button` draws its item as our `Button`
 * (`ghost` by default, as React's toolbars use), with the kit's disabled handling; the kit's
 * `Button` can't be the element, as its own attributes would replace the toolbar's.
 *
 * ```ts
 * Toolbar(h, {
 *   props: { items: [{ value: "refresh" }, { value: "archive", disabled: true }] },
 *   view: (toolbar) =>
 *     toolbar.root(h.div).attr("aria-label", "List actions").children(
 *       toolbar.button({ element: h.button.on("click", Message.Refresh()), value: "refresh" })
 *         .children("Refresh"),
 *       toolbar.button({ element: h.button, value: "archive", size: "icon" })
 *         .attr("aria-label", "Archive").children(Icon(h, "archive")),
 *     ),
 * })
 * ```
 */
export const Toolbar = restyle(KitToolbar, (toolbar) => {
  const button = <O extends Parameters<typeof toolbar.button>[0]>(
    options: O & { readonly variant?: ButtonVariant; readonly size?: ButtonSize },
  ) => {
    const { element, value, variant = "ghost", size = "default" } = options;
    const target = element as unknown as View.ElementBuilder<unknown>;
    return toolbar.button({
      element: styled(
        target.attrs({ "data-slot": "button", "data-variant": variant, "data-size": size }),
        buttonVariants({ variant, size }),
      ) as unknown as O["element"],
      value,
    });
  };
  return {
    ...toolbar,
    root: stylePart(toolbar.root, "toolbar", toolbarClasses),
    button: Object.assign(button, toolbar.button),
  };
});
