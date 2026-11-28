import type { View } from "@effect/ui";
import type { Html } from "@effect/ui/html";
import { Drawer as KitDrawer, type DrawerSwipeDirection } from "@effect/ui-kit/Drawer";
import {
  sheetContentClasses,
  sheetContentScrollClasses,
  sheetFooterClasses,
  sheetHeaderClasses,
  sheetOverlayClasses,
} from "@omnisuite/ui/lib/recipes/sheet";
import { textVariants } from "@omnisuite/ui/lib/recipes/text";
import { Icon } from "@omnisuite/ui/effect/lib/icons";
import { restyle, stylePart, styledSlot } from "@omnisuite/ui/effect/lib/styled";
import { Button } from "@omnisuite/ui/effect/components/button";

/** The edge a sheet sits on, as React's `side` names it. */
export type SheetSide = "top" | "right" | "bottom" | "left";

/** React's `side` for the kit's `swipeDirection`: a sheet swipes away toward its edge. */
export const sheetSideOf: Record<DrawerSwipeDirection, SheetSide> = {
  up: "top",
  right: "right",
  down: "bottom",
  left: "left",
};

// React's sheet is a Base UI dialog that doesn't swipe. The kit's drawer moves the popup through
// these variables while a swipe runs, and a swipe's close slides it the rest of the way out
// rather than back to React's closed offset.
const popupSwipeClasses =
  "data-[side=bottom]:translate-y-(--drawer-swipe-movement-y) data-[side=top]:translate-y-(--drawer-swipe-movement-y) data-[side=left]:translate-x-(--drawer-swipe-movement-x) data-[side=right]:translate-x-(--drawer-swipe-movement-x) data-swipe-dismiss:data-[side=bottom]:data-ending-style:translate-y-full data-swipe-dismiss:data-[side=top]:data-ending-style:-translate-y-full data-swipe-dismiss:data-[side=left]:data-ending-style:-translate-x-full data-swipe-dismiss:data-[side=right]:data-ending-style:translate-x-full";
// The backdrop fades as the sheet is swiped away.
const backdropSwipeClasses = "opacity-[calc(1-var(--drawer-swipe-progress,0))]";

/**
 * React's `Sheet`, on the kit's `Drawer` so it also swipes away: called as the kit's, with our
 * styled parts in `view`, `header` and `footer` for React's `SheetHeader` and `SheetFooter`, and
 * `content`, which draws what React's `SheetContent` does: the portal, the backdrop and the popup,
 * with a close button. The kit's `swipeDirection` picks the edge, `right` by default as React's
 * `side`, and the popup carries React's `data-side` for it (`up` is `top`, `down` is `bottom`).
 *
 * ```ts
 * Sheet(h, {
 *   props: { open: model.filters, swipeDirection: "left" },
 *   onEmit: { ... },
 *   view: (sheet) =>
 *     h.div(
 *       sheet.trigger(Button(h, { variant: "outline" })).children("Filters"),
 *       sheet.content(h, [sheet.header(h.div).children(sheet.title(h.h2).children("Filters"))]),
 *     ),
 * })
 * ```
 */
export const Sheet = restyle(
  KitDrawer,
  (drawer) => {
    const side = sheetSideOf[drawer.swipeDirection];
    const backdrop = stylePart(
      drawer.backdrop,
      "sheet-overlay",
      sheetOverlayClasses,
      backdropSwipeClasses,
    );
    const popup = <B extends View.PartTarget<"div">>(builder: B) =>
      drawer.popup(
        styledSlot(
          builder,
          "sheet-content",
          sheetContentClasses,
          sheetContentScrollClasses,
          popupSwipeClasses,
        ).attr("data-side", side) as unknown as B,
      );
    const closeButton = <Msg>(h: Pick<Html.H<Msg>, "button" | "span" | "svg" | "path">) =>
      drawer
        .close(
          Button(h, { variant: "ghost", size: "icon-sm" })
            .class("absolute top-4 right-4")
            .attr("data-slot", "sheet-close"),
        )
        .children(Icon(h, "x"), h.span.class("sr-only").children("Close"));
    return {
      ...drawer,
      /** React's `side` for the edge the sheet sits on. */
      side,
      trigger: stylePart(drawer.trigger, "sheet-trigger"),
      backdrop,
      popup,
      title: stylePart(drawer.title, "sheet-title", textVariants({ variant: "heading" })),
      description: stylePart(
        drawer.description,
        "sheet-description",
        textVariants({ variant: "secondary" }),
      ),
      header: <B>(builder: B) => styledSlot(builder, "sheet-header", sheetHeaderClasses),
      footer: <B>(builder: B) => styledSlot(builder, "sheet-footer", sheetFooterClasses),
      /** The ghost icon button in the popup's corner that closes the sheet. */
      closeButton,
      /**
       * The portal with the backdrop and the popup around `children`, with a close button.
       * `undefined` while the sheet is closed, as the portal is.
       */
      content: <Msg, C extends View.Children<Msg>>(
        h: Pick<Html.H<Msg>, "dialog" | "div" | "button" | "span" | "svg" | "path">,
        children: C,
        options: { readonly showCloseButton?: boolean } = {},
      ) =>
        drawer
          .portal(h.dialog)
          ?.children(
            backdrop(h.div),
            popup(h.div).children(
              children,
              options.showCloseButton === false ? null : closeButton(h),
            ),
          ),
    };
  },
  { swipeDirection: "right" },
);
