import { UiSchema, type View } from "@effect/ui";
import { Html, HtmlSubscription } from "@effect/ui/html";
import type { VariantProps } from "class-variance-authority";
import { Schema } from "effect";
import {
  sidebarContainerBorderedClasses,
  sidebarContainerClasses,
  sidebarContentClasses,
  sidebarFooterClasses,
  sidebarGapClasses,
  sidebarGapIconClasses,
  sidebarGroupClasses,
  sidebarGroupContentClasses,
  sidebarGroupLabelClasses,
  sidebarHeaderClasses,
  sidebarInnerClasses,
  sidebarInsetClasses,
  sidebarMenuButtonVariants,
  sidebarMenuClasses,
  sidebarMenuItemClasses,
  sidebarMobileClasses,
  sidebarMobileInnerClasses,
  sidebarRootClasses,
  sidebarWrapperClasses,
} from "@omnisuite/ui/lib/recipes/sidebar";
import { textVariants } from "@omnisuite/ui/lib/recipes/text";
import { Button } from "@omnisuite/ui/effect/components/button";
import { Collapsible } from "@omnisuite/ui/effect/components/collapsible";
import { Sheet } from "@omnisuite/ui/effect/components/sheet";
import { Icon } from "@omnisuite/ui/effect/lib/icons";
import { styledSlot } from "@omnisuite/ui/effect/lib/styled";

// React's `SidebarProvider` constants.
const width = "224px";
const widthMobile = "18rem";
const widthIcon = "3rem";
const animationDuration = "250ms";
const easing = "cubic-bezier(0.77, 0, 0.175, 1)";
/** React's `useIsMobile` breakpoint: below 768px the sidebar opens as a sheet. */
export const sidebarMobileQuery = "(max-width: 767px)";
/** The trigger's id, so focus can come back to it once the mobile sheet closes. */
export const sidebarTriggerId = "sidebar-trigger";

// The bar React consumers draw at the top of `SidebarInset` around `SidebarTrigger`.
const insetHeaderClasses = "flex h-14 shrink-0 items-center gap-2 border-b px-4";
// The collapsed panel stays in the page for its slide out, then leaves the tab order.
const containerClosedClasses = "data-closed:not-data-ending-style:invisible";

const SidebarMessage = UiSchema.TaggedEnum({
  SetOpen: { open: Schema.Boolean },
  SetMobileOpen: { open: Schema.Boolean },
  ChangedViewport: { mobile: Schema.Boolean },
  PressedShortcut: {},
});

/**
 * React's `SidebarProvider`, `Sidebar`, `SidebarTrigger` and `SidebarInset` in one component,
 * since the trigger has to sit inside the kit components it opens. The consumer fills its slots:
 * `sidebar` (the sidebar's `SidebarHeader`, `SidebarContent` and `SidebarFooter`), `header` (the
 * inset's top bar, beside the trigger) and `content` (the page). Slot content belongs to the
 * consumer, so toggling the sidebar never resets it.
 *
 * On desktop the sidebar is a `Collapsible` that slides off canvas; below 768px it opens in a
 * modal `Sheet` on its `side`, and focus goes back to the trigger when the sheet closes. Mod+B
 * toggles whichever is showing. React's resize rail, cookie, `icon` collapsing and `floating` and
 * `inset` variants aren't ported yet.
 *
 * ```ts
 * Sidebar(h, {
 *   props: { side: "left" },
 *   slots: {
 *     sidebar: SidebarContent(h).children(SidebarGroup(h).children(menu)),
 *     header: h.h1("Collections"),
 *     content: page,
 *   },
 * })
 * ```
 */
export const Sidebar = Html.component({
  name: "Sidebar",
  props: Schema.Struct({
    defaultOpen: Schema.optional(Schema.Boolean),
    side: Schema.optional(Schema.Literals(["left", "right"])),
  }),
  model: Schema.Struct({
    open: Schema.Boolean,
    mobileOpen: Schema.Boolean,
    mobile: Schema.Boolean,
  }),
  message: SidebarMessage,
  slots: ["sidebar", "header", "content"],
}).make({
  init: ({ props }) => ({ open: props.defaultOpen ?? true, mobileOpen: false, mobile: false }),
  update: {
    SetOpen: ($, { open }) => $.evolve({ open: () => open }),
    SetMobileOpen: ($, { open }) => $.evolve({ mobileOpen: () => open }),
    ChangedViewport: ($, { mobile }) => $.evolve({ mobile: () => mobile, mobileOpen: () => false }),
    PressedShortcut: ($) =>
      $.model.mobile
        ? $.evolve({ mobileOpen: (open) => !open })
        : $.evolve({ open: (open) => !open }),
  },
  subscriptions: () => [
    HtmlSubscription.onMediaQuery(sidebarMobileQuery, (mobile) =>
      SidebarMessage.ChangedViewport({ mobile }),
    ),
    // React listens on the window, so the shortcut also works while typing or in the sheet.
    HtmlSubscription.shortcuts([
      {
        key: "b",
        mod: true,
        whileTyping: true,
        whileModal: true,
        message: SidebarMessage.PressedShortcut(),
      },
    ]),
  ],
  view: (h, model) => {
    const side = h.props.side ?? "left";
    const trigger = Button(h, { variant: "ghost", size: "icon" })
      .attrs({ id: sidebarTriggerId, "data-sidebar": "trigger" })
      .children(Icon(h, "layout-sidebar"), h.span.class("sr-only").children("Toggle Sidebar"));
    // Both kit components stay mounted, so the inset keeps its place, and the page its state,
    // when the viewport crosses the breakpoint.
    return Collapsible(h, {
      props: { open: model.open, keepMounted: "css" },
      onEmit: {
        Toggled: ({ open }) => SidebarMessage.SetOpen({ open }),
        Settled: () => undefined,
      },
      view: (collapsible) =>
        Sheet(h, {
          props: { open: model.mobile && model.mobileOpen, swipeDirection: side },
          onEmit: {
            RequestedOpen: () => SidebarMessage.SetMobileOpen({ open: true }),
            RequestedClose: () => SidebarMessage.SetMobileOpen({ open: false }),
            Snapped: () => undefined,
            Settled: () => undefined,
          },
          view: (sheet) => {
            const desktop = () =>
              collapsible
                .root(h.div)
                .class(sidebarRootClasses)
                .attrs({
                  "data-slot": "sidebar",
                  "data-state": model.open ? "expanded" : "collapsed",
                  "data-collapsible": model.open ? "" : "offcanvas",
                  "data-variant": "sidebar",
                  "data-side": side,
                })
                .children(
                  styledSlot(h.div, "sidebar-gap", sidebarGapClasses, sidebarGapIconClasses),
                  collapsible
                    .panel(h.div)
                    ?.attrs({ "data-slot": "sidebar-container", "data-side": side })
                    .class(
                      sidebarContainerClasses,
                      sidebarContainerBorderedClasses,
                      containerClosedClasses,
                    )
                    .children(
                      styledSlot(h.div, "sidebar-inner", sidebarInnerClasses)
                        .attr("data-sidebar", "sidebar")
                        .children(h.slots.sidebar),
                    ),
                );
            const mobile = () =>
              sheet.portal(h.dialog)?.children(
                sheet.backdrop(h.div),
                sheet
                  .popup(h.div)
                  .class(sidebarMobileClasses)
                  .style({ "--sidebar-width": widthMobile })
                  .attrs({
                    "data-slot": "sidebar",
                    "data-sidebar": "sidebar",
                    "data-mobile": "true",
                  })
                  .children(
                    sheet
                      .header(h.div)
                      .class("sr-only")
                      .children(
                        sheet.title(h.h2).children("Sidebar"),
                        sheet.description(h.p).children("Displays the mobile sidebar."),
                      ),
                    h.div.class(sidebarMobileInnerClasses).children(h.slots.sidebar),
                  ),
              );
            return styledSlot(h.div, "sidebar-wrapper", sidebarWrapperClasses)
              .style({
                "--sidebar-width": width,
                "--sidebar-width-icon": widthIcon,
                "--sidebar-animation-duration": animationDuration,
                "--sidebar-easing": easing,
              })
              .children(
                model.mobile ? mobile() : desktop(),
                styledSlot(h.main, "sidebar-inset", sidebarInsetClasses).children(
                  h.header
                    .class(insetHeaderClasses)
                    .children(
                      (model.mobile ? sheet.trigger(trigger) : collapsible.trigger(trigger)).attr(
                        "data-slot",
                        "sidebar-trigger",
                      ),
                      h.slots.header,
                    ),
                  h.slots.content,
                ),
              );
          },
        }),
    });
  },
});

type DivOptions<Msg> = { readonly element?: Html.H<Msg>["div"] };

/** React's `SidebarHeader`. */
export const SidebarHeader = <Msg>(h: Pick<Html.H<Msg>, "div">, options: DivOptions<Msg> = {}) =>
  styledSlot(options.element ?? h.div, "sidebar-header", sidebarHeaderClasses).attr(
    "data-sidebar",
    "header",
  );

/** React's `SidebarFooter`. */
export const SidebarFooter = <Msg>(h: Pick<Html.H<Msg>, "div">, options: DivOptions<Msg> = {}) =>
  styledSlot(options.element ?? h.div, "sidebar-footer", sidebarFooterClasses).attr(
    "data-sidebar",
    "footer",
  );

/** React's `SidebarContent`: the scrolling middle. */
export const SidebarContent = <Msg>(h: Pick<Html.H<Msg>, "div">, options: DivOptions<Msg> = {}) =>
  styledSlot(options.element ?? h.div, "sidebar-content", sidebarContentClasses).attr(
    "data-sidebar",
    "content",
  );

/** React's `SidebarGroup`. */
export const SidebarGroup = <Msg>(h: Pick<Html.H<Msg>, "div">, options: DivOptions<Msg> = {}) =>
  styledSlot(options.element ?? h.div, "sidebar-group", sidebarGroupClasses).attr(
    "data-sidebar",
    "group",
  );

/**
 * React's `SidebarGroupLabel`, on any builder: `h.div`, or a collapsible's trigger to fold the
 * group as React's `render={<CollapsibleTrigger />}` does.
 */
export const SidebarGroupLabel = <B extends View.PartTarget<string>>(builder: B): B =>
  styledSlot(
    builder,
    "sidebar-group-label",
    textVariants({ variant: "secondary", size: "sm" }),
    sidebarGroupLabelClasses,
  ).attr("data-sidebar", "group-label");

/** React's `SidebarGroupContent`. */
export const SidebarGroupContent = <Msg>(
  h: Pick<Html.H<Msg>, "div">,
  options: DivOptions<Msg> = {},
) =>
  styledSlot(options.element ?? h.div, "sidebar-group-content", sidebarGroupContentClasses).attr(
    "data-sidebar",
    "group-content",
  );

/** React's `SidebarMenu`. */
export const SidebarMenu = <Msg>(
  h: Pick<Html.H<Msg>, "ul">,
  options: { readonly element?: Html.H<Msg>["ul"] } = {},
) =>
  styledSlot(options.element ?? h.ul, "sidebar-menu", sidebarMenuClasses).attr(
    "data-sidebar",
    "menu",
  );

/** React's `SidebarMenuItem`. */
export const SidebarMenuItem = <Msg>(
  h: Pick<Html.H<Msg>, "li">,
  options: { readonly element?: Html.H<Msg>["li"] } = {},
) =>
  styledSlot(options.element ?? h.li, "sidebar-menu-item", sidebarMenuItemClasses).attr(
    "data-sidebar",
    "menu-item",
  );

export type SidebarMenuButtonVariant = NonNullable<
  VariantProps<typeof sidebarMenuButtonVariants>["variant"]
>;
export type SidebarMenuButtonSize = NonNullable<
  VariantProps<typeof sidebarMenuButtonVariants>["size"]
>;

/**
 * React's `SidebarMenuButton` on any builder: `h.button`, or `h.a` for a link. `active` marks
 * the current page with `data-active`.
 */
export const SidebarMenuButton = <B extends View.PartTarget<string>>(
  builder: B,
  options: {
    readonly active?: boolean;
    readonly variant?: SidebarMenuButtonVariant;
    readonly size?: SidebarMenuButtonSize;
  } = {},
): B => {
  const { active = false, variant = "default", size = "default" } = options;
  const button = styledSlot(
    builder,
    "sidebar-menu-button",
    sidebarMenuButtonVariants({ variant, size }),
  )
    .attr("data-sidebar", "menu-button")
    .attr("data-size", size);
  return active ? button.attr("data-active", "") : button;
};
