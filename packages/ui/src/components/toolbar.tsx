import * as React from "react";
import { cn } from "cn";
import { toolbarClasses } from "@omnisuite/ui/lib/recipes/toolbar";

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
    <div role="toolbar" data-slot="toolbar" className={cn(toolbarClasses, className)} {...props} />
  );
}

export { Toolbar };
