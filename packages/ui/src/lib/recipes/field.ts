import { cva } from "class-variance-authority";

export const fieldSetClasses =
  "flex flex-col gap-4 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3";

export const fieldLegendClasses =
  "mb-2 font-medium data-[variant=label]:text-xs/relaxed data-[variant=legend]:text-sm";

export const fieldGroupClasses =
  "group/field-group @container/field-group flex w-full flex-col gap-4 data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4";

export const fieldContentClasses = "group/field-content flex flex-1 flex-col gap-0.5 leading-snug";

export const fieldTitleClasses =
  "flex w-fit items-center gap-2 text-xs/relaxed font-medium group-data-[disabled=true]/field:opacity-50";

export const fieldErrorClasses = "text-xs/relaxed font-normal text-destructive";

export const fieldVariants = cva(
  "group/field flex w-full gap-2 data-[invalid=true]:text-destructive",
  {
    variants: {
      orientation: {
        vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
        horizontal:
          "flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        responsive:
          "flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  },
);

export const fieldLabelClasses = [
  "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50 has-data-checked:bg-primary/5 has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border has-[>[data-slot=field]]:not-has-[:disabled,[data-disabled]]:hover:bg-input/40 has-[>[data-slot=field]]:has-[:focus-visible]:border-ring has-[>[data-slot=field]]:has-[:focus-visible]:ring-2 has-[>[data-slot=field]]:has-[:focus-visible]:ring-ring/30 *:data-[slot=field]:p-2 dark:has-data-checked:bg-primary/10",
  "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col",
] as const;

export const fieldDescriptionClasses = [
  "text-left text-xs/relaxed leading-normal font-normal text-muted-foreground group-has-data-horizontal/field:text-balance [[data-variant=legend]+&]:-mt-1.5",
  "last:mt-0 nth-last-2:-mt-1",
  "[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
] as const;
