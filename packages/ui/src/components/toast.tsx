import * as React from "react";
import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { cn } from "cn";
import {
  toastViewportClasses,
  toastRootClasses,
  toastContentClasses,
  toastCloseClasses,
  toastIconClasses,
} from "@omnisuite/ui/lib/recipes/toast";

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
      className={cn(toastViewportClasses, className)}
      {...props}
    />
  );
}

function Toast({ className, ...props }: ToastPrimitive.Root.Props) {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={cn(...toastRootClasses, className)}
      {...props}
    />
  );
}

function ToastContent({ className, ...props }: ToastPrimitive.Content.Props) {
  return (
    <ToastPrimitive.Content
      data-slot="toast-content"
      className={cn(toastContentClasses, className)}
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
      className={cn(toastCloseClasses, className)}
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
    <span data-slot="toast-icon" aria-hidden="true" className={toastIconClasses}>
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
