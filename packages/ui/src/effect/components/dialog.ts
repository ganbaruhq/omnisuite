import type { View } from "@effect/ui";
import type { Html } from "@effect/ui/html";
import { Dialog as KitDialog } from "@effect/ui-kit/Dialog";
import { textVariants } from "@omnisuite/ui/lib/recipes/text";
import { Icon } from "@omnisuite/ui/effect/lib/icons";
import { restyle, stylePart, styledSlot } from "@omnisuite/ui/effect/lib/styled";
import { Button } from "@omnisuite/ui/effect/components/button";

// React's popup centres itself with `fixed` and a translate. The kit draws a viewport around the
// popup for that, so the viewport is the fixed grid and the popup sits in it.
const viewportClasses = "fixed inset-0 z-50 grid place-items-center p-4";
const popupClasses =
  "relative grid w-full max-w-md gap-4 rounded-xl bg-popover p-6 text-popover-foreground shadow-lg ring-1 ring-border outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none";
const backdropClasses =
  "fixed inset-0 z-50 bg-black/80 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none";

/**
 * The kit's `Dialog` with our styles, `header` and `footer` for the layout React's
 * `DialogHeader` and `DialogFooter` give, and `content`, which draws what React's
 * `DialogContent` does: the portal, backdrop, viewport and popup, with a close button.
 *
 * ```ts
 * Dialog(h, {
 *   props: { open: model.open },
 *   onEmit: { ... },
 *   view: (dialog) =>
 *     h.div(
 *       dialog.trigger(Button(h, { variant: "outline" })).children("New collection"),
 *       dialog.content(h, [dialog.header(h.div).children(dialog.title(h.h2).children("New collection"))]),
 *     ),
 * })
 * ```
 */
export const Dialog = restyle(KitDialog, (dialog) => {
  const backdrop = stylePart(dialog.backdrop, "dialog-overlay", backdropClasses);
  const viewport = stylePart(dialog.viewport, "dialog-viewport", viewportClasses);
  const popup = stylePart(dialog.popup, "dialog-content", popupClasses);
  const closeButton = <Msg>(h: Pick<Html.H<Msg>, "button" | "span" | "svg" | "path">) =>
    dialog
      .close(Button(h, { variant: "ghost", size: "icon-sm" }).class("absolute top-4 right-4"))
      .children(Icon(h, "x"), h.span.class("sr-only").children("Close"));
  return {
    ...dialog,
    backdrop,
    viewport,
    popup,
    title: stylePart(dialog.title, "dialog-title", textVariants({ variant: "heading" })),
    description: stylePart(
      dialog.description,
      "dialog-description",
      textVariants({ variant: "secondary" }),
    ),
    header: <B>(builder: B) => styledSlot(builder, "dialog-header", "flex flex-col gap-1.5 pr-8"),
    footer: <B>(builder: B) => styledSlot(builder, "dialog-footer", "flex justify-end gap-2"),
    /** The ghost icon button in the popup's corner that closes the dialog. */
    closeButton,
    /**
     * The portal with the backdrop, and the popup inside the viewport, around `children`.
     * `undefined` while the dialog is closed, as the portal is.
     */
    content: <Msg, C extends View.Children<Msg>>(
      h: Pick<Html.H<Msg>, "dialog" | "div" | "button" | "span" | "svg" | "path">,
      children: C,
      options: { readonly showCloseButton?: boolean } = {},
    ) =>
      dialog
        .portal(h.dialog)
        ?.children(
          backdrop(h.div),
          viewport(h.div).children(
            popup(h.div).children(
              children,
              options.showCloseButton === false ? null : closeButton(h),
            ),
          ),
        ),
  };
});
