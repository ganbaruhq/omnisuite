import * as React from "react";
import { cn } from "cn";

/**
 * Joined control strip: a search field and filter, sort or refresh buttons
 * sharing one border (Cloudflare dashboard list toolbar).
 *
 *   <Toolbar aria-label="Collections">
 *     <InputGroup>…</InputGroup>
 *     <Button variant="ghost">Show all</Button>
 *     <Button variant="ghost" size="icon" aria-label="Refresh">…</Button>
 *   </Toolbar>
 *
 * The border is a real border, not an inset ring, so a child's hover fill stays
 * inside it. Icon buttons stay square at the strip's height.
 *
 * Direct children (an `InputGroup`, buttons, menu triggers) lose their own radius
 * and shadow, and every child after the first gets a hairline divider, so the
 * strip reads as one control. The input group takes the free width.
 */
function Toolbar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="toolbar"
      data-slot="toolbar"
      className={cn(
        "flex h-9 w-full min-w-0 items-stretch overflow-hidden rounded-md border border-border bg-background shadow-xs",
        "has-[[data-slot=input-group-control]:focus-visible]:border-ring",
        "*:data-[slot=input-group]:h-full *:data-[slot=input-group]:flex-1 *:data-[slot=input-group]:rounded-none *:data-[slot=input-group]:border-0 *:data-[slot=input-group]:bg-transparent *:data-[slot=input-group]:ring-0! *:data-[slot=input-group]:[&_svg:not([class*='size-'])]:size-4",
        "*:not-data-[slot=input-group]:h-full *:not-data-[slot=input-group]:rounded-none *:not-data-[slot=input-group]:shadow-none *:not-data-[slot=input-group]:border-y-0 *:not-data-[slot=input-group]:border-r-0 *:not-data-[slot=input-group]:focus-visible:shadow-none! *:not-data-[slot=input-group]:focus-visible:inset-ring-2 *:not-data-[slot=input-group]:focus-visible:inset-ring-ring *:not-first:border-l *:not-first:border-border *:data-[size^=icon]:aspect-square *:data-[size^=icon]:w-auto",
        className,
      )}
      {...props}
    />
  );
}

export { Toolbar };
