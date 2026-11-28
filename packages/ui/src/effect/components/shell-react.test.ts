import { createElement as e } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vite-plus/test";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@omnisuite/ui/components/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@omnisuite/ui/components/sidebar";
import { Toolbar } from "@omnisuite/ui/components/toolbar";

// Every element's slot and classes, in document order.
const classes = (html: string) =>
  [...html.matchAll(/<([a-z]+)\s[^>]*>/g)].flatMap(([element, tag]) => {
    const className = /class="([^"]*)"/.exec(element)?.[1];
    const slot = /data-slot="([^"]*)"/.exec(element)?.[1] ?? "";
    return className === undefined ? [] : [`${tag}[${slot}]: ${className}`];
  });

it("preserves React class output for the avatar, toolbar and sidebar recipes", () => {
  expect(
    classes(
      renderToStaticMarkup(
        e(
          AvatarGroup,
          null,
          ...(["default", "sm", "lg", "40"] as const).map((size) =>
            e(
              Avatar,
              { key: size, size },
              e(AvatarFallback, { color: "purple" }, "AL"),
              e(AvatarBadge),
            ),
          ),
          e(AvatarGroupCount, null, "+3"),
        ),
      ),
    ),
  ).toMatchSnapshot("Avatar");
  expect(classes(renderToStaticMarkup(e(Toolbar)))).toMatchSnapshot("Toolbar");
  for (const defaultOpen of [true, false])
    expect(
      classes(
        renderToStaticMarkup(
          e(
            SidebarProvider,
            { defaultOpen },
            e(
              Sidebar,
              null,
              e(SidebarHeader),
              e(
                SidebarContent,
                null,
                e(
                  SidebarGroup,
                  null,
                  e(SidebarGroupLabel, null, "Pages"),
                  e(
                    SidebarGroupContent,
                    null,
                    e(
                      SidebarMenu,
                      null,
                      e(
                        SidebarMenuItem,
                        null,
                        e(SidebarMenuButton, { isActive: true }, "Home"),
                        e(SidebarMenuButton, { variant: "outline", size: "lg" }, "Big"),
                      ),
                    ),
                  ),
                ),
              ),
              e(SidebarFooter),
            ),
            e(Sidebar, { collapsible: "none" }),
            e(Sidebar, { side: "right", variant: "floating", collapsible: "icon" }),
            e(SidebarInset),
          ),
        ),
      ),
    ).toMatchSnapshot(defaultOpen ? "Sidebar expanded" : "Sidebar collapsed");
});
