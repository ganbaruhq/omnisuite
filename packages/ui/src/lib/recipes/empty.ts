import { cva } from "class-variance-authority";
import { textVariants } from "@omnisuite/ui/lib/recipes/text";
export const emptyClasses = [
  "flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-4 rounded-xl border-dashed p-6 text-center text-balance",
];

export const emptyHeaderClasses = ["flex max-w-sm flex-col items-center gap-1"];

export const emptyMediaVariants = cva(
  "mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export const emptyTitleClasses = [textVariants({ variant: "heading" }), "tracking-tight"];

export const emptyDescriptionClasses = [
  textVariants({ variant: "secondary" }),
  "leading-relaxed [&>a]:underline [&>a:hover]:text-primary",
];

export const emptyContentClasses = [
  "flex w-full max-w-sm min-w-0 flex-col items-center gap-2 text-sm/relaxed text-balance",
];
