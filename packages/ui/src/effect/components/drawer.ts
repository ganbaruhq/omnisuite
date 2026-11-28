import type { View } from "@effect/ui";
import type { Html } from "@effect/ui/html";
import { Drawer as KitDrawer } from "@effect/ui-kit/Drawer";
import {
  drawerBodyClasses,
  drawerContentClasses,
  drawerFooterClasses,
  drawerHeaderClasses,
  drawerOverlayClasses,
  drawerPopupClasses,
  drawerSwipeHandleClasses,
  drawerViewportClasses,
} from "@omnisuite/ui/lib/recipes/drawer";
import { textVariants } from "@omnisuite/ui/lib/recipes/text";
import { restyle, stylePart, styledSlot } from "@omnisuite/ui/effect/lib/styled";

// The popup's stack scale reads the swipe's progress, which the kit, as Base UI, sets only on the
// backdrop. Without a value the popup's whole transform is dropped, and with it the swipe.
const popupProgressFallback = "[--drawer-swipe-progress:0]";

/** The kit drawer's parts, as `restyle` hands them to a style. */
type DrawerParts = Parameters<Parameters<typeof restyle<typeof KitDrawer, unknown>>[1]>[0];

interface Flags {
  readonly modal: boolean | "trap-focus";
  readonly hasSnapPoints: boolean;
}

const style =
  ({ modal, hasSnapPoints }: Flags) =>
  (drawer: DrawerParts) => {
    const snapPoints = hasSnapPoints ? "" : undefined;
    const swipeAxis =
      drawer.swipeDirection === "down" || drawer.swipeDirection === "up" ? "y" : "x";
    const backdrop = <B extends View.PartTarget<"div">>(builder: B) =>
      drawer.backdrop(
        styledSlot(builder, "drawer-overlay", drawerOverlayClasses).attr(
          "data-snap-points",
          snapPoints,
        ) as unknown as B,
      );
    const viewport = <B extends View.PartTarget<"div">>(builder: B) =>
      drawer.viewport(
        styledSlot(builder, "drawer-viewport", drawerViewportClasses).attr(
          "data-modal",
          String(modal),
        ) as unknown as B,
      );
    const popup = <B extends View.PartTarget<"div">>(builder: B) =>
      drawer.popup(
        styledSlot(builder, "drawer-popup", ...drawerPopupClasses, popupProgressFallback)
          .attr("data-swipe-axis", swipeAxis)
          .attr("data-snap-points", snapPoints) as unknown as B,
      );
    const contentArea = stylePart(drawer.content, "drawer-content", drawerContentClasses);
    const swipeHandle = <B extends View.PartTarget<"div">>(builder: B): B =>
      styledSlot(builder, "drawer-swipe-handle", drawerSwipeHandleClasses).attr(
        "aria-hidden",
        "true",
      ) as unknown as B;
    return {
      ...drawer,
      trigger: stylePart(drawer.trigger, "drawer-trigger"),
      backdrop,
      viewport,
      popup,
      /** The kit's `content` part: React's inner `drawer-content`, where a drag selects text. */
      contentArea,
      /** The grabber React's `showSwipeHandle` draws at the popup's swiping edge. */
      swipeHandle,
      title: stylePart(drawer.title, "drawer-title", textVariants({ variant: "heading" })),
      description: stylePart(
        drawer.description,
        "drawer-description",
        textVariants({ variant: "secondary" }),
        "text-balance",
      ),
      header: <B>(builder: B) => styledSlot(builder, "drawer-header", drawerHeaderClasses),
      /** The scrolling area between the header and the footer, as React's `DrawerBody`. */
      body: <B>(builder: B) => styledSlot(builder, "drawer-body", drawerBodyClasses),
      footer: <B>(builder: B) => styledSlot(builder, "drawer-footer", drawerFooterClasses),
      /**
       * The portal with the backdrop (for a modal drawer), the viewport and the popup around
       * `children`, as React's `DrawerContent`. `undefined` while the drawer is closed.
       */
      content: <Msg, C extends View.Children<Msg>>(
        h: Pick<Html.H<Msg>, "dialog" | "div">,
        children: C,
        options: { readonly showSwipeHandle?: boolean } = {},
      ) =>
        drawer
          .portal(h.dialog)
          ?.children(
            modal === true ? backdrop(h.div) : null,
            viewport(h.div).children(
              popup(h.div).children(
                options.showSwipeHandle === true ? swipeHandle(h.div) : null,
                contentArea(h.div).children(children),
              ),
            ),
          ),
    };
  };

const defaults = { modal: true, swipeDirection: "down" } as const;

const Typed = restyle(KitDrawer, style({ modal: true, hasSnapPoints: false }), defaults);

/**
 * React's `Drawer`, on the kit's `Drawer`: called as the kit's, with React's defaults (modal,
 * swiping `down`) and our styled parts in `view`: `header`, `body` and `footer` for React's
 * layout parts, `swipeHandle`, and `content`, which draws what React's `DrawerContent` does.
 * The parts read `modal` and `snapPoints` from the props, as React's read them from its context.
 *
 * ```ts
 * Drawer(h, {
 *   props: { open: model.open },
 *   onEmit: { ... },
 *   view: (drawer) =>
 *     h.div(
 *       drawer.trigger(Button(h, { variant: "outline" })).children("Details"),
 *       drawer.content(h, [drawer.header(h.div).children(drawer.title(h.h2).children("Details"))], {
 *         showSwipeHandle: true,
 *       }),
 *     ),
 * })
 * ```
 */
export const Drawer: typeof Typed = Object.assign(
  (
    h: never,
    options: {
      readonly props: {
        readonly modal?: boolean | "trap-focus" | undefined;
        readonly snapPoints?: ReadonlyArray<unknown> | undefined;
      };
    },
  ) =>
    (
      restyle(
        KitDrawer,
        style({
          modal: options.props.modal ?? defaults.modal,
          hasSnapPoints: (options.props.snapPoints?.length ?? 0) > 0,
        }),
        defaults,
      ) as unknown as (h: never, options: unknown) => unknown
    )(h, options),
  { kit: KitDrawer },
) as unknown as typeof Typed;
