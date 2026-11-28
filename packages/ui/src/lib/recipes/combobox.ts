export const comboboxTriggerClasses = "[&_svg:not([class*='size-'])]:size-3.5";

export const comboboxTriggerIconClasses = "pointer-events-none size-3.5 text-muted-foreground";

export const comboboxTriggerButtonClasses =
  "group-has-data-[slot=combobox-clear]/input-group:hidden data-pressed:bg-transparent";

export const comboboxPositionerClasses = "isolate z-50";

export const comboboxContentClasses =
  "group/combobox-content relative max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) min-w-[calc(var(--anchor-width)+--spacing(7))] origin-(--transform-origin) overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[chips=true]:min-w-(--anchor-width) data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 *:data-[slot=input-group]:m-1 *:data-[slot=input-group]:mb-0 *:data-[slot=input-group]:h-7 *:data-[slot=input-group]:border-none *:data-[slot=input-group]:bg-input/20 *:data-[slot=input-group]:shadow-none dark:bg-popover data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95";

export const comboboxListClasses =
  "no-scrollbar max-h-[min(calc(--spacing(72)---spacing(9)),calc(var(--available-height)---spacing(9)))] scroll-py-1 overflow-y-auto overscroll-contain p-1 data-empty:p-0";

export const comboboxItemClasses =
  "relative flex min-h-7 w-full cursor-default items-center gap-2 rounded-md px-2 py-1 text-xs/relaxed outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground not-data-[variant=destructive]:data-highlighted:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5";

export const comboboxItemIndicatorClasses =
  "pointer-events-none absolute right-2 flex items-center justify-center";

export const comboboxLabelClasses = "px-2 py-1.5 text-xs text-muted-foreground";

export const comboboxEmptyClasses =
  "hidden w-full justify-center py-2 text-center text-xs/relaxed text-muted-foreground group-data-empty/combobox-content:flex";

export const comboboxSeparatorClasses = "-mx-1 my-1 h-px bg-border/50";

export const comboboxChipsClasses =
  "flex min-h-8 cursor-text flex-wrap content-start items-center gap-1 rounded-md border border-input bg-input/20 bg-clip-padding p-1.5 text-xs/relaxed transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 has-aria-invalid:border-destructive has-aria-invalid:ring-2 has-aria-invalid:ring-destructive/20 dark:bg-input/30 dark:has-aria-invalid:border-destructive/50 dark:has-aria-invalid:ring-destructive/40";

export const comboboxChipClasses =
  "flex h-4.5 w-fit cursor-default items-center justify-center gap-1 rounded-[calc(var(--radius-sm)-2px)] bg-muted-foreground/10 px-1.5 text-xs/relaxed font-medium whitespace-nowrap text-foreground outline-none focus-visible:bg-muted-foreground/20 focus-visible:ring-2 focus-visible:ring-ring/50 has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50 has-data-[slot=combobox-chip-remove]:pr-0";

export const comboboxChipRemoveClasses = "-ml-1 size-4 opacity-50 hover:opacity-100";

export const comboboxChipInputClasses = "h-4.5 min-w-16 flex-1 px-1 outline-none";
