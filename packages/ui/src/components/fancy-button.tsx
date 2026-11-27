import { cva, type VariantProps } from "class-variance-authority";
import { ButtonBase, type ButtonProps } from "@omnisuite/ui/components/button";

// Untitled UI button look (https://www.untitledui.com/react/components/buttons):
// skeuomorphic inset edge, white top highlight on filled variants, inset rings,
// outline focus. Same variant/size names and async props as `Button`, so the two
// swap freely; `Button` stays the plain AlignUI-style default.

const fancyButtonVariants = cva(
  "group/button relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md font-medium whitespace-nowrap select-none outline-ring transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-2 aria-invalid:ring-destructive/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Untitled "primary": solid fill, skeuomorphic edge, top inner highlight.
        default:
          "bg-primary text-primary-foreground shadow-xs-skeuomorphic ring-1 ring-transparent ring-inset before:pointer-events-none before:absolute before:inset-px before:rounded-[inherit] before:border before:border-white/12 before:mask-b-from-0% hover:bg-primary/90",
        // Untitled "secondary": white fill, inset ring.
        outline:
          "bg-background text-foreground shadow-xs-skeuomorphic ring-1 ring-border ring-inset hover:bg-accent aria-expanded:bg-accent",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs-skeuomorphic ring-1 ring-border ring-inset hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-accent",
        // Untitled "tertiary": text only, tint on hover.
        ghost:
          "text-muted-foreground hover:bg-accent hover:text-foreground aria-expanded:bg-accent aria-expanded:text-foreground",
        // Untitled "primary-destructive".
        destructive:
          "bg-destructive text-white shadow-xs-skeuomorphic ring-1 ring-transparent outline-destructive ring-inset before:pointer-events-none before:absolute before:inset-px before:rounded-[inherit] before:border before:border-white/12 before:mask-b-from-0% hover:bg-destructive/90",
        // Untitled "link-color".
        link: "h-auto rounded-sm bg-transparent p-0 text-primary hover:underline",
      },
      size: {
        default: "h-8 gap-1.5 px-3 text-sm [&_svg:not([class*='size-'])]:size-4",
        xs: "h-6 gap-1 px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1.5 px-3 text-sm [&_svg:not([class*='size-'])]:size-3.5",
        md: "h-9 gap-1.5 px-3.5 text-sm [&_svg:not([class*='size-'])]:size-4",
        lg: "h-10 gap-1.5 px-4 text-sm [&_svg:not([class*='size-'])]:size-5",
        icon: "size-8 [&_svg:not([class*='size-'])]:size-4",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-10 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type FancyButtonProps = Omit<ButtonProps, "variant" | "size"> &
  VariantProps<typeof fancyButtonVariants>;

function FancyButton({
  className,
  variant = "default",
  size = "default",
  ...props
}: FancyButtonProps) {
  return (
    <ButtonBase size={size} styles={fancyButtonVariants({ variant, size, className })} {...props} />
  );
}

export { FancyButton, fancyButtonVariants };
export type { FancyButtonProps };
