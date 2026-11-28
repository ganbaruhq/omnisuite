import { cva } from "class-variance-authority";

/** The provider's wrapper around the sidebar and its inset. */
export const sidebarWrapperClasses =
  "group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar";

/** A sidebar that never collapses (`collapsible="none"`). */
export const sidebarStaticClasses =
  "flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground";

/** The sheet the sidebar opens in below the mobile breakpoint. */
export const sidebarMobileClasses =
  "w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden";

export const sidebarMobileInnerClasses = "flex h-full w-full flex-col";

/** The desktop sidebar: carries the state attributes its parts style off. */
export const sidebarRootClasses = "group peer hidden text-sidebar-foreground md:block";

/** The in-flow gap that pushes the inset aside, as wide as the fixed container. */
export const sidebarGapClasses = [
  "relative w-(--sidebar-width) bg-transparent transition-[width] duration-(--sidebar-animation-duration) ease-(--sidebar-easing) motion-reduce:transition-none",
  "group-data-[collapsible=offcanvas]:w-0",
  "group-data-[side=right]:rotate-180",
] as const;

export const sidebarGapIconClasses = "group-data-[collapsible=icon]:w-(--sidebar-width-icon)";

/** The gap's icon width for the floating and inset variants, which pad the container. */
export const sidebarGapIconPaddedClasses =
  "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]";

export const sidebarContainerClasses =
  "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-(--sidebar-animation-duration) ease-(--sidebar-easing) motion-reduce:transition-none data-[side=left]:left-0 data-[side=left]:group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)] data-[side=right]:right-0 data-[side=right]:group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)] md:flex";

export const sidebarContainerBorderedClasses =
  "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l";

/** The container for the floating and inset variants. */
export const sidebarContainerPaddedClasses =
  "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]";

export const sidebarInnerClasses =
  "flex size-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:shadow-md group-data-[variant=floating]:ring-1 group-data-[variant=floating]:ring-sidebar-border";

export const sidebarInsetClasses =
  "relative flex w-full flex-1 flex-col bg-background md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-md md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2";

export const sidebarHeaderClasses =
  "flex flex-col gap-2 p-2 transition-[padding] duration-(--sidebar-animation-duration) ease-(--sidebar-easing) motion-reduce:transition-none";

export const sidebarFooterClasses = sidebarHeaderClasses;

export const sidebarContentClasses =
  "sidebar-scrollbar flex min-h-0 flex-1 flex-col gap-0 overflow-auto overflow-x-hidden whitespace-nowrap group-data-[collapsible=icon]:overflow-hidden";

export const sidebarGroupClasses =
  "relative flex w-full min-w-0 flex-col px-2 py-1 transition-[padding] duration-(--sidebar-animation-duration) ease-(--sidebar-easing) motion-reduce:transition-none";

/** Follows `textVariants({ variant: "secondary", size: "sm" })`. */
export const sidebarGroupLabelClasses = [
  "font-medium",
  "flex shrink-0 items-center overflow-hidden rounded-md px-2 pb-2 whitespace-nowrap ring-sidebar-ring outline-hidden [interpolate-size:allow-keywords] transition-[height,padding,margin,color,border-color] duration-(--sidebar-animation-duration) ease-(--sidebar-easing) motion-reduce:transition-none focus-visible:ring-2 group-data-[collapsible=icon]:h-0 group-data-[collapsible=icon]:rounded-none group-data-[collapsible=icon]:py-0 group-data-[collapsible=icon]:text-transparent [&>svg]:size-4 [&>svg]:shrink-0",
] as const;

export const sidebarGroupContentClasses = "w-full text-xs";

export const sidebarMenuClasses = "flex w-full min-w-0 flex-col gap-1";

export const sidebarMenuItemClasses = "group/menu-item relative";

export const sidebarMenuButtonVariants = cva(
  "peer/menu-button group/menu-button flex w-full cursor-default items-center gap-1.5 overflow-hidden font-medium text-foreground [&>span]:transition-opacity [&>span]:duration-(--sidebar-animation-duration) [&>span]:ease-(--sidebar-easing) group-data-[collapsible=icon]:[&>span]:sr-only group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-0! rounded-[calc(var(--radius-sm)+2px)] px-2 py-0 text-left text-[13px] ring-sidebar-ring outline-hidden transition-[color] group-has-data-[sidebar=menu-action]/menu-item:pr-9 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-has-[[data-sidebar=menu-action]:hover,[data-sidebar=menu-action][aria-expanded=true]]/menu-item:bg-sidebar-accent group-has-[[data-sidebar=menu-action]:hover,[data-sidebar=menu-action][aria-expanded=true]]/menu-item:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground data-active:bg-primary/10 data-active:font-medium data-active:text-primary data-active:hover:bg-primary/15 data-active:hover:text-primary [&_svg]:size-4 [&_svg]:shrink-0 [&>span:last-child]:truncate",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_var(--sidebar-accent)]",
      },
      size: {
        default: "h-7 text-[13px]",
        sm: "h-7 text-[13px]",
        lg: "h-12 text-[13px] group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
