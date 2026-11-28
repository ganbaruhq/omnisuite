import * as React from "react";
import { cn } from "cn";
import { labelClasses } from "@omnisuite/ui/lib/recipes/label";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label data-slot="label" className={cn(labelClasses, className)} {...props} />;
}

export { Label };
