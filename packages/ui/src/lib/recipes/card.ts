import { textVariants } from "@omnisuite/ui/lib/recipes/text";
export const cardClasses = [
  "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-lg bg-card py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/10 [--card-spacing:--spacing(4)] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)] *:[img:first-child]:rounded-t-lg *:[img:last-child]:rounded-b-lg",
];

export const cardHeaderClasses = [
  "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-lg px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
];

export const cardTitleClasses = [textVariants({ variant: "heading" })];

export const cardDescriptionClasses = [textVariants({ variant: "secondary" })];

export const cardActionClasses = ["col-start-2 row-span-2 row-start-1 self-start justify-self-end"];

export const cardContentClasses = ["px-(--card-spacing)"];

export const cardFooterClasses = [
  "flex items-center rounded-b-lg px-(--card-spacing) [.border-t]:pt-(--card-spacing)",
];
