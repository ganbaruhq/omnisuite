import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "cn";
import { switchClasses, switchThumbClasses } from "@omnisuite/ui/lib/recipes/switch";

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default";
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(switchClasses, className)}
      {...props}
    >
      <SwitchPrimitive.Thumb data-slot="switch-thumb" className={switchThumbClasses} />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
