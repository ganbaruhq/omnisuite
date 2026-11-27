import * as React from "react";
import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { cn } from "cn";

import { Button } from "@omnisuite/ui/components/button";
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@omnisuite/ui/components/avatar";
import { textVariants } from "@omnisuite/ui/components/text";
import {
  IconX,
  IconCircleCheck,
  IconInfoCircle,
  IconAlertTriangle,
  IconAlertOctagon,
  IconLoader,
} from "@tabler/icons-react";

type ToastData =
  | { variant: "icon"; icon?: React.ReactNode }
  | {
      variant: "avatar";
      avatar: { src: string; alt: string; fallback: string };
      date?: React.ReactNode;
    };

const toast = ToastPrimitive.createToastManager<ToastData>();

function ToastProvider({ ...props }: ToastPrimitive.Provider.Props) {
  return <ToastPrimitive.Provider {...props} />;
}

function ToastPortal({ ...props }: ToastPrimitive.Portal.Props) {
  return <ToastPrimitive.Portal data-slot="toast-portal" {...props} />;
}

function ToastViewport({ className, ...props }: ToastPrimitive.Viewport.Props) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        "pointer-events-none fixed inset-x-4 bottom-4 z-100 mx-auto w-auto max-w-sm outline-none sm:right-4 sm:left-auto sm:mx-0 sm:w-full",
        className,
      )}
      {...props}
    />
  );
}

function Toast({ className, ...props }: ToastPrimitive.Root.Props) {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={cn(
        "group/toast pointer-events-auto absolute right-0 bottom-0 z-[calc(1000-var(--toast-index))] w-full origin-bottom rounded-xl border bg-popover text-popover-foreground will-change-transform outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "[--gap:0.75rem] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))]",
        "h-(--height) [transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--peek))-(var(--shrink)*var(--height))))_scale(var(--scale))] [transition:transform_500ms_cubic-bezier(0.22,1,0.36,1),opacity_500ms,height_150ms]",
        "after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",
        "data-expanded:h-(--toast-height) data-expanded:[transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]",
        "data-limited:opacity-0 data-starting-style:[transform:translateY(150%)]",
        "[&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[transform:translateY(150%)]",
        "data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]",
        "data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
        "data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
        "data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]",
        "data-expanded:data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]",
        "data-expanded:data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
        "data-expanded:data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
        "data-expanded:data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]",
        className,
      )}
      {...props}
    />
  );
}

function ToastContent({ className, ...props }: ToastPrimitive.Content.Props) {
  return (
    <ToastPrimitive.Content
      data-slot="toast-content"
      className={cn(
        "relative flex h-full items-start gap-4 overflow-hidden p-4 pr-10 transition-opacity duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] data-behind:opacity-0 data-expanded:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function ToastTitle({ className, ...props }: ToastPrimitive.Title.Props) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn(textVariants({ variant: "body" }), "font-semibold break-words", className)}
      {...props}
    />
  );
}

function ToastDescription({ className, ...props }: ToastPrimitive.Description.Props) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn(textVariants({ variant: "secondary" }), "break-words", className)}
      {...props}
    />
  );
}

function ToastAction({
  className,
  render = <Button variant="link" />,
  ...props
}: ToastPrimitive.Action.Props) {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      render={render}
      className={cn("h-auto shrink-0 p-0 font-semibold", className)}
      {...props}
    />
  );
}

function ToastClose({
  className,
  children,
  render = <Button variant="ghost" size="icon-sm" />,
  ...props
}: ToastPrimitive.Close.Props) {
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      aria-label="Close toast"
      render={render}
      className={cn(
        "relative shrink-0 text-muted-foreground after:absolute after:-inset-2 after:content-[''] hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children ?? <IconX aria-hidden="true" />}
    </ToastPrimitive.Close>
  );
}

function ToastIcon({
  type,
  icon: customIcon,
}: {
  type: string | undefined;
  icon?: React.ReactNode;
}) {
  let icon: React.ReactNode = <IconInfoCircle aria-hidden="true" />;

  if (type === "success") {
    icon = <IconCircleCheck aria-hidden="true" />;
  }

  if (type === "info") {
    icon = <IconInfoCircle aria-hidden="true" />;
  }

  if (type === "warning") {
    icon = <IconAlertTriangle aria-hidden="true" />;
  }

  if (type === "error") {
    icon = <IconAlertOctagon aria-hidden="true" />;
  }

  if (type === "loading") {
    icon = <IconLoader className="animate-spin motion-reduce:animate-none" aria-hidden="true" />;
  }

  return (
    <span
      data-slot="toast-icon"
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground shadow-xs [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5"
    >
      {customIcon ?? icon}
    </span>
  );
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager<ToastData>();

  return toasts.map((toastItem) => (
    <Toast key={toastItem.id} toast={toastItem}>
      <ToastContent>
        {toastItem.data?.variant === "avatar" ? (
          <Avatar size="lg">
            <AvatarImage src={toastItem.data.avatar.src} alt={toastItem.data.avatar.alt} />
            <AvatarFallback>{toastItem.data.avatar.fallback}</AvatarFallback>
            <AvatarBadge className="bg-success-foreground" aria-label="Online" />
          </Avatar>
        ) : (
          <ToastIcon
            type={toastItem.type}
            icon={toastItem.data?.variant === "icon" ? toastItem.data.icon : undefined}
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {toastItem.title && <ToastTitle />}
            {toastItem.data?.variant === "avatar" && toastItem.data.date && (
              <span className={textVariants({ variant: "secondary", size: "xs" })}>
                {toastItem.data.date}
              </span>
            )}
          </div>
          {toastItem.description && <ToastDescription />}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <ToastClose
              aria-label="Dismiss"
              render={<Button variant="link" />}
              className="h-auto p-0 font-semibold"
            >
              Dismiss
            </ToastClose>
            {toastItem.actionProps && <ToastAction />}
          </div>
        </div>
        <ToastClose className="absolute top-3 right-3" />
      </ToastContent>
    </Toast>
  ));
}

function Toaster({ children, toastManager = toast, ...props }: ToastPrimitive.Provider.Props) {
  return (
    <ToastProvider toastManager={toastManager} {...props}>
      {children}
      <ToastPortal>
        <ToastViewport>
          <ToastList />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  );
}

const createToastManager = ToastPrimitive.createToastManager;
const useToastManager = ToastPrimitive.useToastManager;

export {
  Toaster,
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  createToastManager,
  toast,
  useToastManager,
};
export type { ToastData };
