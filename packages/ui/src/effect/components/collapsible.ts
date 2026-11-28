import { Collapsible as KitCollapsible } from "@effect/ui-kit/Collapsible";
import { restyle, stylePart } from "@omnisuite/ui/effect/lib/styled";

/**
 * React's `Collapsible`, `CollapsibleTrigger` and `CollapsibleContent` on the kit's: no classes,
 * only React's `data-slot` on `root`, `trigger` and `panel`. The consumer keeps `open`.
 */
export const Collapsible = restyle(KitCollapsible, (collapsible) => ({
  ...collapsible,
  root: stylePart(collapsible.root, "collapsible"),
  trigger: stylePart(collapsible.trigger, "collapsible-trigger"),
  panel: stylePart(collapsible.panel, "collapsible-content"),
}));
