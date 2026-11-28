import type { View } from "@effect/ui";
import type { Html } from "@effect/ui/html";
import { Tooltip as KitTooltip, TooltipProvider } from "@effect/ui-kit/Tooltip";
import { tooltipArrowClasses, tooltipContentClasses } from "@omnisuite/ui/lib/recipes/tooltip";
import { popoverReset, restyle, stylePart } from "@omnisuite/ui/effect/lib/styled";

/**
 * The kit's `Tooltip` with our styles, React's defaults (`sideOffset: 4`, no delay), and
 * `content`, which draws the positioner and popup around `children` with the arrow. The kit
 * leaves `open` to the consumer:
 *
 * ```ts
 * Tooltip(h, {
 *   props: { open: model.tip },
 *   onEmit: { RequestedOpen: () => Message.Tip({ open: true }), RequestedClose: () => Message.Tip({ open: false }) },
 *   view: (tooltip) => h.span(tooltip.trigger(Button(h)).children("Save"), tooltip.content(h, ["Saves the draft"])),
 * })
 * ```
 */
export const Tooltip = restyle(
  KitTooltip,
  (tooltip) => {
    const positioner = stylePart(
      tooltip.positioner,
      "tooltip-positioner",
      popoverReset,
      "isolate z-50",
    );
    const popup = stylePart(tooltip.popup, "tooltip-content", tooltipContentClasses);
    const arrow = stylePart(tooltip.arrow, "tooltip-arrow", tooltipArrowClasses);
    return {
      ...tooltip,
      positioner,
      popup,
      arrow,
      content: <Msg, C extends View.Children<Msg>>(h: Pick<Html.H<Msg>, "div">, children: C) =>
        positioner(h.div).children(popup(h.div).children(children, arrow(h.div))),
    };
  },
  { sideOffset: 4, delay: 0 },
);

export { TooltipProvider };
