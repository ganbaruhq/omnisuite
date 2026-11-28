import { kbdClasses, kbdGroupClasses } from "@omnisuite/ui/lib/recipes/kbd";
import { cn } from "cn";

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return <kbd data-slot="kbd" className={cn(...kbdClasses, className)} {...props} />;
}

function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <kbd data-slot="kbd-group" className={cn(...kbdGroupClasses, className)} {...props} />;
}

export { Kbd, KbdGroup };
