export const pageClasses = [
  "grid grow auto-rows-min gap-y-7 py-8 [--page-bleed-gutter:var(--page-padding-x)] [--page-max-width:1400px] [--page-padding-x:--spacing(4)] md:[--page-padding-x:--spacing(8)]",
  "grid-cols-[minmax(var(--page-padding-x),1fr)_minmax(0,var(--page-max-width))_minmax(var(--page-padding-x),1fr)]",
  "*:col-start-2 *:data-full-bleed:col-span-full",
];

export const pageFullBleedClasses = ["px-(--page-bleed-gutter)"];

export const pageHeaderClasses = [
  "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
];

export const pageHeadingClasses = ["flex min-w-0 flex-col gap-1"];

export const pageTitleClasses = [
  "flex items-center gap-2 tracking-tight [&_svg:not([class*='size-'])]:size-5",
];

export const pageDescriptionClasses = ["max-w-2xl text-pretty"];

export const pageActionsClasses = ["flex shrink-0 flex-wrap items-center gap-2"];

export const pageSectionClasses = ["grid auto-rows-min gap-4"];

export const pageSectionTitleClasses = ["col-span-full"];

export const pageBodyClasses = ["@container/page-body flex min-w-0 grow"];

export const pageAsideClasses = ["hidden w-100 shrink-0 border-l @5xl/page-body:block"];

export const pageAsideContentClasses = [
  "sticky top-(--page-header-height,0px) flex flex-col gap-4 p-6",
];
