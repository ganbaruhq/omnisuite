import { cva } from "class-variance-authority";

// Based on Hairline UI button (MIT) https://hairlineui.com/ui/button
// Visual style from AlignUI v1.2 buttons: flat fills, inset 1px rings, a
// shadow-sm only on the resting stroke button, and a two-ring focus shadow
// (2px gap + 4px tint) instead of an outline. Variant mapping:
//   default → primary/filled   outline → neutral/stroke   secondary → neutral/lighter
//   ghost → neutral/ghost      destructive → error/filled
// Keeps the base-ui primitive and the existing variant/size names.
//
// Every variant has shadcn base-mira's `border border-transparent
// bg-clip-padding`, so all share one box: a fill stops 1px inside it (a solid
// button doesn't read larger than a stroke one), and the stroke variant just
// colours that border. Hover fills that drop the stroke recolour the border to
// the fill so the button doesn't shrink by 1px.

const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md border border-transparent bg-clip-padding font-medium whitespace-nowrap select-none",
    "outline-none transition duration-200 ease-out",
    "disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground/60 disabled:border-transparent disabled:shadow-none",
    "aria-invalid:border-destructive",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    // Icons sit half a step into the padding, as AlignUI's -mx-1 icon slot does.
    "[&>[data-icon=inline-start]]:-ml-0.5 [&>[data-icon=inline-end]]:-mr-0.5",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-[color-mix(in_oklab,var(--primary),black_15%)] focus-visible:shadow-button-primary-focus",
        outline:
          "border-border bg-background text-muted-foreground shadow-xs hover:border-muted hover:bg-muted hover:text-foreground hover:shadow-none focus-visible:border-foreground focus-visible:text-foreground focus-visible:shadow-button-important-focus aria-expanded:border-muted aria-expanded:bg-muted aria-expanded:text-foreground aria-expanded:shadow-none",
        secondary:
          "bg-muted text-muted-foreground hover:border-border hover:bg-background hover:text-foreground hover:shadow-sm focus-visible:border-foreground focus-visible:bg-background focus-visible:text-foreground focus-visible:shadow-button-important-focus aria-expanded:border-border aria-expanded:bg-background aria-expanded:text-foreground",
        ghost:
          "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:border-foreground focus-visible:bg-background focus-visible:text-foreground focus-visible:shadow-button-important-focus aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "bg-destructive text-white hover:bg-[color-mix(in_oklab,var(--destructive),black_15%)] focus-visible:shadow-button-error-focus",
        link: "h-auto rounded-sm bg-transparent p-0 text-primary hover:underline focus-visible:underline",
      },
      // AlignUI heights: lg = medium (40), md = small (36), default = xsmall (32),
      // sm = xxsmall (28); xs (24) is ours.
      size: {
        default: "h-8 gap-2 px-2.5 text-sm",
        xs: "h-6 gap-1.5 px-2 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-7 gap-2 px-2 text-sm",
        md: "h-9 gap-2 px-3 text-sm [&_svg:not([class*='size-'])]:size-4.5",
        lg: "h-10 gap-2 rounded-lg px-3.5 text-sm [&_svg:not([class*='size-'])]:size-5",
        icon: "size-8",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-7",
        "icon-lg": "size-10 rounded-lg [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export { buttonVariants };
