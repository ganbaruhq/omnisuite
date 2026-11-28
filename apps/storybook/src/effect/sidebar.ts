import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@omnisuite/ui/effect/components/sidebar";

export const sidebarDemo = (example: "Navigation" | "Collapsed" | "Right") =>
  Html.component({ name: "SidebarDemo", model: Schema.Struct({}), message: Schema.Never }).make({
    init: () => ({}),
    update: ($) => $.model,
    view: (h) => {
      const collapsed = example === "Collapsed",
        right = example === "Right";
      return Sidebar(h, {
        props: { defaultOpen: !collapsed, side: right ? "right" : "left" },
        slots: {
          sidebar: SidebarContent(h).children(
            SidebarGroup(h).children(
              SidebarGroupContent(h).children(
                SidebarMenu(h).children(
                  SidebarMenuItem(h).children(
                    SidebarMenuButton(h.button).children("Collections"),
                    SidebarMenu(h)
                      .class("ml-4 border-l pl-2")
                      .children(
                        SidebarMenuItem(h).children(
                          SidebarMenuButton(h.a.attr("href", "#all"), {
                            active: true,
                          }).children("All collections"),
                        ),
                        SidebarMenuItem(h).children(
                          SidebarMenuButton(h.a.attr("href", "#favorites")).children("Favorites"),
                        ),
                      ),
                  ),
                ),
              ),
            ),
          ),
          header: h.span.children(""),
          content: h.div
            .class("p-6")
            .children(h.p.class("text-sm").children("Resize or collapse the sidebar.")),
        },
      });
    },
  });
