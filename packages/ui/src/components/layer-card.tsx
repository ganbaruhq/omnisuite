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
  return (
    <div
      data-slot="layer-card"
      className={cn(
        "flex w-full min-w-0 flex-col overflow-hidden rounded-lg bg-elevated text-sm shadow-xs ring ring-border",
        className,
      )}
      {...props}
    />
  );
}

function LayerCardPrimary({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="layer-card-primary"
      className={cn(
        "relative flex shrink-0 flex-col gap-2 overflow-hidden rounded-lg bg-background p-4 pr-3 ring ring-border transition-colors duration-100",
        className,
      )}
      {...props}
    />
  );
}

function LayerCardSecondary({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="layer-card-secondary"
      className={cn(
        "flex h-10 min-w-0 shrink-0 items-center gap-2 px-4 font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { LayerCard, LayerCardPrimary, LayerCardSecondary };
