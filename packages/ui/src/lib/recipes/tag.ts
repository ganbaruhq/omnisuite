import { cva } from "class-variance-authority";
export const tagVariants = cva(
  [
    "relative inline-flex w-fit shrink-0 items-center gap-0.75 rounded-md bg-background font-medium whitespace-nowrap text-foreground ring-1 ring-border ring-inset select-none dark:bg-input/30",
    "outline-ring outline-offset-2 has-[[data-slot=tag-toggle]:focus-visible]:outline-2",
    "has-[[data-slot=tag-count],[data-slot=tag-remove]]:pr-1",
    "data-disabled:cursor-not-allowed data-disabled:opacity-50",
  ],
  {
    variants: {
      size: {
        sm: "px-2 py-0.75 text-xs/4.5 not-data-selectable:has-data-[slot=avatar]:pl-1 not-data-selectable:has-data-[slot=status-dot]:pl-1.5 data-selectable:pl-1.25",
        md: "px-2.25 py-0.5 text-sm/5 not-data-selectable:has-data-[slot=avatar]:pl-1.25 not-data-selectable:has-data-[slot=status-dot]:pl-1.75 data-selectable:pl-1",
        lg: "px-2.5 py-1 text-sm/5 not-data-selectable:has-data-[slot=avatar]:pl-1.75 not-data-selectable:has-data-[slot=status-dot]:pl-2.25 data-selectable:pl-1.25",
      },
    },
    defaultVariants: { size: "sm" },
  },
);

export const tagGroupClasses = ["flex flex-wrap gap-2"];

export const tagToggleClasses = [
  "group/tag-toggle inline-flex cursor-pointer items-center outline-none after:absolute after:inset-0 after:rounded-md disabled:cursor-not-allowed",
];

export const tagContentClasses = ["inline-flex items-center"];

export const tagRemoveClasses = [
  "relative z-10 inline-flex shrink-0 cursor-pointer items-center justify-center rounded-[3px] text-muted-foreground outline-none transition-colors duration-100 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none",
];

export const tagCheckboxClasses = [
  "inline-flex shrink-0 items-center justify-center rounded-[4px] bg-background ring-1 ring-border ring-inset transition-colors duration-100",
  "group-data-pressed/tag-toggle:bg-primary group-data-pressed/tag-toggle:ring-primary",
  "group-data-disabled/tag-toggle:bg-muted",
];

export const tagAvatarClasses = ["size-4"];

export const tagCountClasses = [
  "inline-flex items-center justify-center rounded-[3px] bg-muted font-medium text-foreground tabular-nums",
];

export const countSize = {
  sm: "px-1 text-xs",
  md: "px-1.25 text-xs",
  lg: "px-1.5 text-sm",
} as const;

export const contentGap = { sm: "gap-1", md: "gap-1.25", lg: "gap-1.5" } as const;
