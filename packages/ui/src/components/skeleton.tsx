import { skeletonClasses } from "@omnisuite/ui/lib/recipes/skeleton";
import { cn } from "cn";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" className={cn(...skeletonClasses, className)} {...props} />;
}

export { Skeleton };
