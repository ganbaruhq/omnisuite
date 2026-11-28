import {
  layerCardClasses,
  layerCardPrimaryClasses,
  layerCardSecondaryClasses,
} from "@omnisuite/ui/lib/recipes/layer-card";
import type * as React from "react";
import { cn } from "cn";

/**
 * Layered card, adapted from Cloudflare Kumo's `LayerCard`.
 *
 *   <LayerCard>
 *     <LayerCardSecondary>Usage</LayerCardSecondary>
 *     <LayerCardPrimary>…</LayerCardPrimary>
 *     <LayerCardSecondary>View records</LayerCardSecondary>
 *   </LayerCard>
 *
 * A tinted shell holds a white primary layer that sits flush with the shell's
 * edges; the two rings overlap, so the primary layer reads as lifted out of
 * the shell rather than inset with padding. Secondary rows are fixed-height
 * (h-10) strips above or below it, sized by height, not padding.
 *
 * Without `LayerCardPrimary`, render content directly in `LayerCard` with your
 * own padding for a plain surface.
 */
function LayerCard({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="layer-card" className={cn(...layerCardClasses, className)} {...props} />;
}

function LayerCardPrimary({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="layer-card-primary"
      className={cn(...layerCardPrimaryClasses, className)}
      {...props}
    />
  );
}

function LayerCardSecondary({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="layer-card-secondary"
      className={cn(...layerCardSecondaryClasses, className)}
      {...props}
    />
  );
}

export { LayerCard, LayerCardPrimary, LayerCardSecondary };
