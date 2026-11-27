import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

import { useIsMobile } from "@omnisuite/ui/hooks/use-mobile";
import { Button } from "@omnisuite/ui/components/button";
import { Input } from "@omnisuite/ui/components/input";
import { Separator } from "@omnisuite/ui/components/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@omnisuite/ui/components/sheet";
import { Skeleton } from "@omnisuite/ui/components/skeleton";
import { textVariants } from "@omnisuite/ui/components/text";
import { Tooltip, TooltipContent, TooltipTrigger } from "@omnisuite/ui/components/tooltip";
import { IconLayoutSidebar } from "@tabler/icons-react";

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
// Drag-to-resize bounds (px), matching Kumo's resizable sidebar.
const SIDEBAR_DEFAULT_WIDTH_PX = 224;
const SIDEBAR_MIN_WIDTH_PX = 200;
const SIDEBAR_MAX_WIDTH_PX = 320;
const SIDEBAR_RESIZE_KEYBOARD_STEP_PX = 10;
/** Pointer travel before a press on the rail counts as a drag instead of a click. */
const SIDEBAR_DRAG_THRESHOLD_PX = 3;
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
// Cloudflare dashboard timing: ease-in-out-quart, so width changes start and land softly.
const SIDEBAR_ANIMATION_DURATION = "250ms";
const SIDEBAR_EASING = "cubic-bezier(0.77, 0, 0.175, 1)";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
  width: number;
  setWidth: (width: number) => void;
  isResizing: boolean;
  setIsResizing: (isResizing: boolean) => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context;
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);

  // This is the internal state of the sidebar.
  // We use openProp and setOpenProp for control from outside the component.
  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }

      // This sets the cookie to keep the sidebar state.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open],
  );

  // Helper to toggle the sidebar.
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
  }, [isMobile, setOpen, setOpenMobile]);

  // Adds a keyboard shortcut to toggle the sidebar.
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? "expanded" : "collapsed";

  const [width, setWidthState] = React.useState(SIDEBAR_DEFAULT_WIDTH_PX);
  const [isResizing, setIsResizing] = React.useState(false);
  const setWidth = React.useCallback((next: number) => {
    setWidthState(Math.round(Math.min(Math.max(next, SIDEBAR_MIN_WIDTH_PX), SIDEBAR_MAX_WIDTH_PX)));
  }, []);

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
      width,
      setWidth,
      isResizing,
      setIsResizing,
    }),
    [
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
      width,
      setWidth,
      isResizing,
    ],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        data-slot="sidebar-wrapper"
        data-resizing={isResizing || undefined}
        style={
          {
            "--sidebar-width": `${width}px`,
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
            // Follow the pointer 1:1 while dragging; animate everything else.
            "--sidebar-animation-duration": isResizing ? "0ms" : SIDEBAR_ANIMATION_DURATION,
            "--sidebar-easing": SIDEBAR_EASING,
            ...style,
          } as React.CSSProperties
        }
        className={cn(
          "group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  dir,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          dir={dir}
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className="group peer hidden text-sidebar-foreground md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-(--sidebar-width) bg-transparent transition-[width] duration-(--sidebar-animation-duration) ease-(--sidebar-easing) motion-reduce:transition-none",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
        )}
      />
      <div
        data-slot="sidebar-container"
        data-side={side}
        className={cn(
          "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-(--sidebar-animation-duration) ease-(--sidebar-easing) motion-reduce:transition-none data-[side=left]:left-0 data-[side=left]:group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)] data-[side=right]:right-0 data-[side=right]:group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)] md:flex",
          // Adjust the padding for floating and inset variants.
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className,
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="flex size-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:shadow-md group-data-[variant=floating]:ring-1 group-data-[variant=floating]:ring-sidebar-border"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/** Toggles the sidebar. Pass an icon as `children` to replace the default. */
function SidebarTrigger({
  className,
  onClick,
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn(className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      {children ?? <IconLayoutSidebar />}
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

/**
 * Edge handle. Click toggles the sidebar; drag resizes it (Kumo behaviour):
 * - expanded, drag inward past the min width → collapses to icons
 * - collapsed, drag outward past the min width → expands and keeps tracking
 * Arrow keys resize by 10px, Home collapses, End expands to the max width.
 */
function SidebarRail({
  className,
  onPointerDown,
  onKeyDown,
  ...props
}: React.ComponentProps<"button">) {
  const { toggleSidebar, open, setOpen, width, setWidth, setIsResizing, isMobile } = useSidebar();

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    onPointerDown?.(event);
    if (event.defaultPrevented || event.button !== 0 || isMobile) return;
    event.preventDefault();

    const rail = event.currentTarget;
    const side = rail.closest<HTMLElement>("[data-side]")?.dataset.side === "right" ? -1 : 1;
    const startX = event.clientX;
    const startWidth =
      rail
        .closest("[data-slot=sidebar]")
        ?.querySelector("[data-slot=sidebar-container]")
        ?.getBoundingClientRect().width ?? width;
    let collapsed = !open;
    let dragging = false;
    rail.setPointerCapture(event.pointerId);

    const handleMove = (move: PointerEvent) => {
      const delta = (move.clientX - startX) * side;
      if (!dragging) {
        if (Math.abs(delta) < SIDEBAR_DRAG_THRESHOLD_PX) return;
        dragging = true;
        setIsResizing(true);
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
      }
      const next = startWidth + delta;
      if (collapsed) {
        if (next >= SIDEBAR_MIN_WIDTH_PX) {
          collapsed = false;
          setOpen(true);
          setWidth(next);
        }
        return;
      }
      if (next < SIDEBAR_MIN_WIDTH_PX) {
        collapsed = true;
        setOpen(false);
        return;
      }
      setWidth(next);
    };

    const handleUp = () => {
      rail.removeEventListener("pointermove", handleMove);
      rail.removeEventListener("pointerup", handleUp);
      rail.removeEventListener("pointercancel", handleUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      if (dragging) setIsResizing(false);
      else toggleSidebar();
    };

    rail.addEventListener("pointermove", handleMove);
    rail.addEventListener("pointerup", handleUp);
    rail.addEventListener("pointercancel", handleUp);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const right = event.currentTarget.closest<HTMLElement>("[data-side]")?.dataset.side === "right";
    const grow = right ? "ArrowLeft" : "ArrowRight";
    const shrink = right ? "ArrowRight" : "ArrowLeft";
    if (event.key === grow) {
      event.preventDefault();
      if (open) setWidth(width + SIDEBAR_RESIZE_KEYBOARD_STEP_PX);
      else setOpen(true);
    } else if (event.key === shrink) {
      event.preventDefault();
      if (width - SIDEBAR_RESIZE_KEYBOARD_STEP_PX < SIDEBAR_MIN_WIDTH_PX) setOpen(false);
      else setWidth(width - SIDEBAR_RESIZE_KEYBOARD_STEP_PX);
    } else if (event.key === "Home") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "End") {
      event.preventDefault();
      setOpen(true);
      setWidth(SIDEBAR_MAX_WIDTH_PX);
    }
  };

  return (
    <button
      type="button"
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Resize sidebar"
      title="Drag to resize, click to toggle"
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 cursor-col-resize touch-none transition-all duration-(--sidebar-animation-duration) ease-(--sidebar-easing) outline-hidden motion-reduce:transition-none group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:start-1/2 after:w-[2px] hover:after:bg-sidebar-border focus-visible:after:bg-sidebar-ring in-data-resizing:after:bg-sidebar-border sm:flex ltr:-translate-x-1/2 rtl:-translate-x-1/2",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className,
      )}
      {...props}
    />
  );
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "relative flex w-full flex-1 flex-col bg-background md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-md md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
        className,
      )}
      {...props}
    />
  );
}

function SidebarInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn("h-8 w-full border-input bg-muted/20 dark:bg-muted/30", className)}
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn(
        "flex flex-col gap-2 p-2 transition-[padding] duration-(--sidebar-animation-duration) ease-(--sidebar-easing) motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn(
        "flex flex-col gap-2 p-2 transition-[padding] duration-(--sidebar-animation-duration) ease-(--sidebar-easing) motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

function SidebarSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn("mx-2 w-auto bg-sidebar-border", className)}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "sidebar-scrollbar flex min-h-0 flex-1 flex-col gap-0 overflow-auto overflow-x-hidden whitespace-nowrap group-data-[collapsible=icon]:overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn(
        "relative flex w-full min-w-0 flex-col px-2 py-1 transition-[padding] duration-(--sidebar-animation-duration) ease-(--sidebar-easing) motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupLabel({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div"> & React.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn(
          // Kumo group label: 13px medium, muted (Text `secondary` `sm` `bold`).
          textVariants({ variant: "secondary", size: "sm" }),
          "font-medium",
          "flex shrink-0 items-center overflow-hidden rounded-md px-2 pb-2 whitespace-nowrap ring-sidebar-ring outline-hidden [interpolate-size:allow-keywords] transition-[height,padding,margin,color,border-color] duration-(--sidebar-animation-duration) ease-(--sidebar-easing) motion-reduce:transition-none focus-visible:ring-2 group-data-[collapsible=icon]:h-0 group-data-[collapsible=icon]:rounded-none group-data-[collapsible=icon]:py-0 group-data-[collapsible=icon]:text-transparent [&>svg]:size-4 [&>svg]:shrink-0",
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "sidebar-group-label",
      sidebar: "group-label",
    },
  });
}

function SidebarGroupAction({
  className,
  render,
  ...props
}: useRender.ComponentProps<"button"> & React.ComponentProps<"button">) {
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(
          "absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden after:absolute after:-inset-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0",
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "sidebar-group-action",
      sidebar: "group-action",
    },
  });
}

function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("w-full text-xs", className)}
      {...props}
    />
  );
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  );
}

const sidebarMenuButtonVariants = cva(
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

function SidebarMenuButton({
  render,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}: useRender.ComponentProps<"button"> &
  React.ComponentProps<"button"> & {
    isActive?: boolean;
    tooltip?: string | React.ComponentProps<typeof TooltipContent>;
  } & VariantProps<typeof sidebarMenuButtonVariants>) {
  const { isMobile, state } = useSidebar();
  const comp = useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(sidebarMenuButtonVariants({ variant, size }), className),
      },
      props,
    ),
    render: !tooltip ? render : <TooltipTrigger render={render} />,
    state: {
      slot: "sidebar-menu-button",
      sidebar: "menu-button",
      size,
      active: isActive,
    },
  });

  if (!tooltip) {
    return comp;
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    };
  }

  return (
    <Tooltip>
      {comp}
      <TooltipContent
        side="right"
        align="center"
        hidden={state !== "collapsed" || isMobile}
        {...tooltip}
      />
    </Tooltip>
  );
}

/**
 * Trailing icon on a menu row (e.g. "…" for a menu). Looks like a bare icon,
 * no hover fill, but stays a native button so it is focusable and opens a
 * `DropdownMenuTrigger` on click, Enter or Space; the row keeps its highlight
 * while the menu is open.
 */
function SidebarMenuAction({
  className,
  render,
  showOnHover = false,
  ...props
}: useRender.ComponentProps<"button"> &
  React.ComponentProps<"button"> & {
    showOnHover?: boolean;
  }) {
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(
          "absolute top-1/2 right-1 flex size-7 cursor-default -translate-y-1/2 items-center justify-center rounded-sm p-0 text-muted-foreground ring-sidebar-ring outline-hidden transition-colors group-data-[collapsible=icon]:hidden after:absolute after:-inset-2 hover:text-sidebar-accent-foreground aria-expanded:text-sidebar-accent-foreground focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0",
          showOnHover &&
            "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 peer-data-active/menu-button:text-foreground aria-expanded:opacity-100 md:opacity-0",
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "sidebar-menu-action",
      sidebar: "menu-action",
    },
  });
}

function SidebarMenuBadge({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-[calc(var(--radius-sm)-2px)] px-1 text-xs font-medium text-muted-foreground tabular-nums select-none group-data-[collapsible=icon]:hidden peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1.5 peer-data-active/menu-button:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean;
}) {
  // Random width between 50 to 90%.
  const [width] = React.useState(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  });

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
      {...props}
    >
      {showIcon && <Skeleton className="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

// Animates height auto → 0 (via `interpolate-size`) when the sidebar goes to
// icon mode, instead of a `display: none` jump. A 1fr → 0fr grid-row transition
// was tried and snaps to the padding on the first frame.
function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <div
      data-slot="sidebar-menu-sub-wrapper"
      className="overflow-hidden [interpolate-size:allow-keywords] transition-[height,opacity] duration-(--sidebar-animation-duration) ease-(--sidebar-easing) motion-reduce:transition-none group-data-[collapsible=icon]:h-0 group-data-[collapsible=icon]:opacity-0"
    >
      <ul
        data-slot="sidebar-menu-sub"
        data-sidebar="menu-sub"
        className={cn("relative flex min-w-0 flex-col gap-1 pt-1", className)}
        {...props}
      />
    </div>
  );
}

function SidebarMenuSubItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("group/menu-sub-item relative ml-2", className)}
      {...props}
    />
  );
}

function SidebarMenuSubButton({
  render,
  size = "md",
  isActive = false,
  className,
  ...props
}: useRender.ComponentProps<"a"> &
  React.ComponentProps<"a"> & {
    size?: "sm" | "md";
    isActive?: boolean;
  }) {
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        className: cn(
          "flex h-7 min-w-0 cursor-default items-center gap-1.5 overflow-hidden rounded-md py-0 pr-2 pl-2 font-medium text-foreground ring-sidebar-ring outline-hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[size=md]:text-[13px] data-[size=sm]:text-xs data-active:bg-primary/10 data-active:font-medium data-active:text-primary data-active:hover:bg-primary/15 data-active:hover:text-primary [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "sidebar-menu-sub-button",
      sidebar: "menu-sub-button",
      size,
      active: isActive,
    },
  });
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};
