import { separatorClasses } from "@omnisuite/ui/lib/recipes/separator";
import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import { cn } from "cn";

function Separator({ className, orientation = "horizontal", ...props }: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(separatorClasses, className)}
      {...props}
    />
  );
}

export { Separator };
