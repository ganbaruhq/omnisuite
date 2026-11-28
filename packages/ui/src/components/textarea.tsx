import * as React from "react";
import { cn } from "cn";
import { textareaClasses } from "@omnisuite/ui/lib/recipes/textarea";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn(textareaClasses, className)} {...props} />;
}

export { Textarea };
