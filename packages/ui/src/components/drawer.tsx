"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { cn } from "cn";
import {
  drawerOverlayClasses,
  drawerSwipeHandleClasses,
  drawerViewportClasses,
  drawerContentClasses,
  drawerHeaderClasses,
  drawerBodyClasses,
  drawerFooterClasses,
  drawerPopupClasses,
} from "@omnisuite/ui/lib/recipes/drawer";
import { textVariants } from "@omnisuite/ui/components/text";

type DrawerContextProps = {
  hasSnapPoints: boolean;
  modal: DrawerPrimitive.Root.Props["modal"];
  showSwipeHandle: boolean;
  swipeDirection: NonNullable<DrawerPrimitive.Root.Props["swipeDirection"]>;
};

const DrawerContext = React.createContext<DrawerContextProps | null>(null);

function useDrawer() {
  const context = React.useContext(DrawerContext);

  if (!context) {
    throw new Error("useDrawer must be used within a Drawer.");
  }

  return context;
}

function Drawer({
  modal = true,
  showSwipeHandle = false,
  snapPoints,
  swipeDirection = "down",
  ...props
}: DrawerPrimitive.Root.Props & {
  showSwipeHandle?: boolean;
}) {
  const hasSnapPoints = snapPoints != null && snapPoints.length > 0;
  const contextValue = React.useMemo(
    () => ({ hasSnapPoints, modal, showSwipeHandle, swipeDirection }),
    [hasSnapPoints, modal, showSwipeHandle, swipeDirection],
  );

  return (
    <DrawerContext.Provider value={contextValue}>
      <DrawerPrimitive.Root
        data-slot="drawer"
        modal={modal}
        snapPoints={snapPoints}
        swipeDirection={swipeDirection}
        {...props}
      />
    </DrawerContext.Provider>
  );
}

function DrawerTrigger({ ...props }: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({ ...props }: DrawerPrimitive.Portal.Props) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({ ...props }: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({ className, ...props }: DrawerPrimitive.Backdrop.Props) {
  return (
    <DrawerPrimitive.Backdrop
      data-slot="drawer-overlay"
      className={cn(drawerOverlayClasses, className)}
      {...props}
    />
  );
}

function DrawerSwipeHandle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-swipe-handle"
      aria-hidden="true"
      className={cn(drawerSwipeHandleClasses, className)}
      {...props}
    />
  );
}

function DrawerContent({ className, children, ...props }: DrawerPrimitive.Popup.Props) {
  const { hasSnapPoints, modal, showSwipeHandle, swipeDirection } = useDrawer();
  const swipeAxis = swipeDirection === "down" || swipeDirection === "up" ? "y" : "x";

  return (
    <DrawerPortal data-slot="drawer-portal">
      {modal === true && <DrawerOverlay data-snap-points={hasSnapPoints ? "" : undefined} />}
      <DrawerPrimitive.Viewport
        data-slot="drawer-viewport"
        data-modal={modal}
        className={drawerViewportClasses}
      >
        <DrawerPrimitive.Popup
          data-slot="drawer-popup"
          data-swipe-axis={swipeAxis}
          data-snap-points={hasSnapPoints ? "" : undefined}
          className={cn(...drawerPopupClasses, className)}
          {...props}
        >
          {showSwipeHandle && <DrawerSwipeHandle />}
          <DrawerPrimitive.Content data-slot="drawer-content" className={cn(drawerContentClasses)}>
            {children}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="drawer-header" className={cn(drawerHeaderClasses, className)} {...props} />
  );
}

// Scrollable area between DrawerHeader and DrawerFooter. When present, the
// header and footer pin in place and gain their own padding and a divider, so
// scrolled content never touches the description or the actions.
function DrawerBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="drawer-body" className={cn(drawerBodyClasses, className)} {...props} />;
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="drawer-footer" className={cn(drawerFooterClasses, className)} {...props} />
  );
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn(textVariants({ variant: "heading" }), className)}
      {...props}
    />
  );
}

function DrawerDescription({ className, ...props }: DrawerPrimitive.Description.Props) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn(textVariants({ variant: "secondary" }), "text-balance", className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerSwipeHandle,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
