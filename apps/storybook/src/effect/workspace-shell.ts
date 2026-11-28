import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { Avatar } from "@omnisuite/ui/effect/components/avatar";
import { Collapsible } from "@omnisuite/ui/effect/components/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@omnisuite/ui/effect/components/sidebar";
import { Toolbar } from "@omnisuite/ui/effect/components/toolbar";
import { Icon } from "@omnisuite/ui/effect/lib/icons";

const Message = UiSchema.TaggedEnum({
  SetPagesOpen: { open: Schema.Boolean },
  Refreshed: {},
  AskedForHelp: {},
});

const pages = [
  { label: "Collections", href: "#collections" },
  { label: "Collection detail", href: "#collection-detail" },
  { label: "Collection list", href: "#your-collections" },
  { label: "Front desk", href: "#front-desk-title" },
] as const;

/**
 * The example's shell: the sidebar's pages, and a header with the workspace's actions and
 * user. The pages are the `content` slot, so collapsing the sidebar or crossing the mobile
 * breakpoint never resets them.
 */
export const WorkspaceShell = Html.component({
  name: "WorkspaceShell",
  model: Schema.Struct({
    pagesOpen: Schema.Boolean,
    refreshes: Schema.Number,
    status: Schema.String,
  }),
  message: Message,
  slots: ["content"],
}).make({
  init: () => ({ pagesOpen: true, refreshes: 0, status: "" }),
  update: {
    SetPagesOpen: ($, { open }) => $.evolve({ pagesOpen: () => open }),
    Refreshed: ($) => {
      const refreshes = $.model.refreshes + 1;
      return $.evolve({
        refreshes: () => refreshes,
        status: () => `Workspace refreshed ${refreshes} ${refreshes === 1 ? "time" : "times"}.`,
      });
    },
    AskedForHelp: ($) =>
      $.evolve({ status: () => "Choose a page in the sidebar to explore the workspace." }),
  },
  view: (h, model) =>
    Sidebar(h, {
      slots: {
        sidebar: [
          SidebarHeader(h).children(
            h.span.class("px-2 text-sm font-semibold").children("Omnisuite"),
          ),
          SidebarContent(h).children(
            Collapsible(h, {
              props: { open: model.pagesOpen },
              onEmit: {
                Toggled: ({ open }) => Message.SetPagesOpen({ open }),
                Settled: () => undefined,
              },
              view: (section) =>
                section.root(SidebarGroup(h)).children(
                  SidebarGroupLabel(section.trigger(h.button))
                    .class("justify-between")
                    .children(
                      "Workspace pages",
                      Icon(h, model.pagesOpen ? "chevron-down" : "chevron-right"),
                    ),
                  section.panel(h.div)?.children(
                    SidebarGroupContent(h).children(
                      SidebarMenu(h).children(
                        pages.map((page) =>
                          SidebarMenuItem(h).children(
                            SidebarMenuButton(h.a.attr("href", page.href), {
                              active: page.href === "#collections",
                            }).children(h.span(page.label)),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
            }),
          ),
          SidebarFooter(h).children(
            h.p.class("px-2 text-xs text-muted-foreground").children("Omnisuite workspace"),
          ),
        ],
        header: h.div.class("flex min-w-0 flex-1 items-center gap-3").children(
          h.span.class("mr-auto text-sm font-medium").children("Workspace"),
          Toolbar(h, {
            props: {
              items: [
                { value: "refresh" },
                { value: "archive", disabled: true, focusableWhenDisabled: false },
                { value: "help" },
              ],
            },
            view: (toolbar) =>
              toolbar
                .root(h.div)
                .class("w-auto")
                .attr("aria-label", "Workspace actions")
                .children(
                  toolbar
                    .button({
                      element: h.button.on("click", Message.Refreshed()),
                      value: "refresh",
                    })
                    .children("Refresh"),
                  toolbar.button({ element: h.button, value: "archive" }).children("Archive"),
                  toolbar
                    .button({
                      element: h.button.on("click", Message.AskedForHelp()),
                      value: "help",
                    })
                    .children("Help"),
                ),
          }),
          Avatar(h, {
            view: (avatar) =>
              avatar
                .root(h.span)
                .attr("aria-label", "Ada Lovelace")
                .children(avatar.fallback(h.span, "purple")?.children("AL")),
          }),
        ),
        content: h.div.children(
          h.p
            .attrs({ role: "status", "data-workspace-status": "" })
            .class("sr-only")
            .children(model.status),
          h.slots.content,
        ),
      },
    }),
});
