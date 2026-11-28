import type { View } from "@effect/ui";
import type { Html } from "@effect/ui/html";
import { Popover as KitPopover } from "@effect/ui-kit/Popover";
import { popoverContentClasses, popoverHeaderClasses } from "@omnisuite/ui/lib/recipes/popover";
import { textVariants } from "@omnisuite/ui/lib/recipes/text";
import {
  popoverReset,
  restyle,
  styleElementPart,
  stylePart,
  styledSlot,
} from "@omnisuite/ui/effect/lib/styled";

/**
 * The kit's `Popover` with our styles, React's defaults (below the trigger, centred, 4px away),
 * `header` for the layout React's `PopoverHeader` gives, and `content`, which draws what React's
 * `PopoverContent` does: the portal, the positioner and the popup around `children`.
 *
 * ```ts
 * Popover(h, {
 *   props: { open: model.help },
 *   onEmit: { ... },
 *   view: (popover) =>
 *     h.div(
 *       popover.trigger({ element: Button(h, { variant: "outline" }) }).children("Help"),
 *       popover.content(h, [popover.title(h.h2).children("About filters")]),
 *     ),
 * })
 * ```
 */
export const Popover = restyle(
  KitPopover,
  (popover) => {
    const positioner = stylePart(
      popover.positioner,
      "popover-positioner",
      popoverReset,
      "isolate z-50",
    );
    const popup = stylePart(popover.popup, "popover-content", popoverContentClasses);
    return {
      ...popover,
      trigger: styleElementPart(popover.trigger, "popover-trigger"),
      positioner,
      popup,
      title: stylePart(
        popover.title,
        "popover-title",
        textVariants({ variant: "body" }),
        "font-medium",
      ),
      description: stylePart(
        popover.description,
        "popover-description",
        textVariants({ variant: "secondary" }),
      ),
      header: <B>(builder: B) => styledSlot(builder, "popover-header", popoverHeaderClasses),
      /**
       * The portal with the positioner and the popup inside, around `children`. `undefined`
       * while the popover is closed, as the portal is.
       */
      content: <Msg, C extends View.Children<Msg>>(
        h: Pick<Html.H<Msg>, "dialog" | "div">,
        children: C,
      ) =>
        popover
          .portal(h.dialog)
          ?.children(positioner(h.div).children(popup(h.div).children(children))),
    };
  },
  { side: "bottom", align: "center", sideOffset: 4, alignOffset: 0 },
);
