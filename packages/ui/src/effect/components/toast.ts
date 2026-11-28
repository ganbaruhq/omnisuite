import type { Html } from "@effect/ui/html";
import { ToastProvider as KitToastProvider } from "@effect/ui-kit/Toast";
import type { ToastData, ToastItem } from "@effect/ui-kit/Toast";
import {
  toastCloseClasses,
  toastContentClasses,
  toastIconClasses,
  toastRootClasses,
  toastViewportClasses,
} from "@omnisuite/ui/lib/recipes/toast";
import { textVariants } from "@omnisuite/ui/lib/recipes/text";
import { buttonVariants } from "@omnisuite/ui/lib/recipes/button";
import { Icon, type IconName } from "@omnisuite/ui/effect/lib/icons";
import {
  popoverReset,
  restyle,
  styleElementPart,
  stylePart,
} from "@omnisuite/ui/effect/lib/styled";
import { Button } from "@omnisuite/ui/effect/components/button";

// The kit has no swipe to dismiss, so it never sets `--toast-swipe-movement-*` or
// `data-swipe-direction`. The variables default to 0 so the recipe's transforms stay valid, and
// the swipe variants never match.
const rootClasses = [
  "[--toast-swipe-movement-x:0px] [--toast-swipe-movement-y:0px]",
  ...toastRootClasses.filter((classes) => !classes.includes("swipe-direction=")),
];

// The viewport is a popover, which the browser stretches with `inset: 0` and `margin: auto`.
const viewportClasses = [popoverReset, "top-auto my-0", toastViewportClasses];

const icons: Record<string, IconName> = {
  success: "circle-check",
  info: "info-circle",
  warning: "alert-triangle",
  error: "alert-octagon",
  loading: "loader",
};

type Drawing = "div" | "span" | "button" | "svg" | "path";

/**
 * The kit's `ToastProvider` with our styles, and `toaster`, which draws the viewport and every
 * toast as React's `Toaster` does: the icon for its `type`, the title, the description, a
 * Dismiss link and a close button. Call it once near the root; any `update` inside its `view`
 * adds a toast with `$.send(ToastProvider.kit, { _tag: "RequestedAdd", toast })`.
 *
 * ```ts
 * ToastProvider(h, { view: (toastProvider) => h.div(App(h, {}), toastProvider.toaster(h)) })
 * ```
 */
export const ToastProvider = restyle(KitToastProvider, (toastProvider) => {
  const viewport = stylePart(toastProvider.viewport, "toast-viewport", ...viewportClasses);
  const root = styleElementPart(toastProvider.root, "toast", ...rootClasses);
  const content = styleElementPart(toastProvider.content, "toast-content", toastContentClasses);
  const title = styleElementPart(
    toastProvider.title,
    "toast-title",
    textVariants({ variant: "body" }),
    "font-semibold break-words",
  );
  const description = styleElementPart(
    toastProvider.description,
    "toast-description",
    textVariants({ variant: "secondary" }),
    "break-words",
  );
  const action = styleElementPart(
    toastProvider.action,
    "toast-action",
    buttonVariants({ variant: "link" }),
    "h-auto shrink-0 p-0 font-semibold",
  );
  const close = styleElementPart(toastProvider.close, "toast-close", toastCloseClasses);

  const icon = <Msg>(h: Pick<Html.H<Msg>, Drawing>, toast: ToastItem) =>
    h.span
      .attrs({ "data-slot": "toast-icon", "aria-hidden": "true" })
      .class(toastIconClasses)
      .children(
        toast.type === "loading"
          ? Icon(h, "loader").class("animate-spin motion-reduce:animate-none")
          : Icon(h, icons[toast.type ?? ""] ?? "info-circle"),
      );

  const toastView = <Msg>(h: Pick<Html.H<Msg>, Drawing>, toast: ToastItem) =>
    root({ element: h.div, toast }).children(
      content({ element: h.div, toast }).children(
        icon(h, toast),
        h.div.class("flex min-w-0 flex-1 flex-col gap-1").children(
          h.div
            .class("flex flex-wrap items-baseline gap-x-2 gap-y-1")
            .children(
              toast.title === undefined
                ? null
                : title({ element: h.div, toast }).children(toast.title),
            ),
          toast.description === undefined
            ? null
            : description({ element: h.div, toast }).children(toast.description),
          h.div.class("mt-2 flex flex-wrap items-center gap-3").children(
            close({
              element: Button(h, { variant: "link" }).class("h-auto p-0 font-semibold"),
              toast,
            })
              .attr("aria-label", "Dismiss")
              .children("Dismiss"),
          ),
        ),
        close({
          element: Button(h, { variant: "ghost", size: "icon-sm" }).class("absolute top-3 right-3"),
          toast,
        })
          .attr("aria-label", "Close toast")
          .children(Icon(h, "x")),
      ),
    );

  return {
    ...toastProvider,
    viewport,
    root,
    content,
    title,
    description,
    action,
    close,
    icon,
    /** The viewport with every toast in it, closing and limited ones included. */
    toaster: <Msg>(h: Pick<Html.H<Msg>, Drawing>) =>
      viewport(h.div).children(toastProvider.toasts.map((toast) => toastView(h, toast))),
  };
});

export type { ToastData, ToastItem };
