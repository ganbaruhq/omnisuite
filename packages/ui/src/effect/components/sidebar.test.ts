import { UiSchema } from "@effect/ui";
import { Html, HtmlServer } from "@effect/ui/html";
import { HtmlLocator, HtmlPlay, TestMediaQueries } from "@effect/ui/html/testing";
import { Locator, TestHost } from "@effect/ui/testing";
import { Effect, Layer, Schema } from "effect";
import { describe, expect, it } from "vite-plus/test";
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
import { sidebarMobileQuery } from "@omnisuite/ui/lib/recipes/sidebar";

const Message = UiSchema.TaggedEnum({ Typed: { query: Schema.String } });

const shell = <const N extends string>(
  name: N,
  props: { readonly defaultOpen?: boolean; readonly side?: "left" | "right" } = {},
) =>
  Html.component({
    name,
    model: Schema.Struct({ query: Schema.String }),
    message: Message,
  }).make({
    init: () => ({ query: "" }),
    update: { Typed: ($, { query }) => $.evolve({ query: () => query }) },
    view: (h, model) =>
      Sidebar(h, {
        props,
        slots: {
          sidebar: [
            SidebarHeader(h).children("Omnisuite"),
            SidebarContent(h).children(
              SidebarGroup(h).children(
                SidebarGroupLabel(h.div).children("Pages"),
                SidebarGroupContent(h).children(
                  SidebarMenu(h).children(
                    SidebarMenuItem(h).children(
                      SidebarMenuButton(h.a.attr("href", "#collections"), {
                        active: true,
                      }).children(h.span("Collections")),
                    ),
                    SidebarMenuItem(h).children(
                      SidebarMenuButton(h.button, { variant: "outline", size: "lg" }).children(
                        h.span("Settings"),
                      ),
                    ),
                  ),
                ),
              ),
            ),
            SidebarFooter(h).children("Signed in"),
          ],
          header: h.h1("Collections"),
          content: h.input
            .attrs({ "aria-label": "Search", value: model.query })
            .on("input", ({ value }) => Message.Typed({ query: value })),
        },
      }),
  });

const tag = (html: string, slot: string) =>
  html.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? "";

const trigger = HtmlLocator.role("button", { name: "Toggle Sidebar" });
const sheet = HtmlLocator.role("dialog", { name: "Sidebar" });
const search = HtmlLocator.role("textbox", { name: "Search" });
const sidebar = Locator.attr("data-slot", "sidebar");

// A played shell, with the media queries the test flips.
const played = <A, E, R>(steps: Effect.Effect<A, E, R>) =>
  Effect.runPromise(
    Effect.scoped(steps).pipe(
      Effect.provide(Layer.merge(TestHost.layer(), TestMediaQueries.layer)),
    ) as Effect.Effect<A, E>,
  );

describe("Effect Sidebar", () => {
  it("draws React's provider, desktop sidebar, inset and menu with React's classes", async () => {
    const { html } = await Effect.runPromise(HtmlServer.renderToHtml(shell("Rendered"), {}));

    const wrapper = tag(html, "sidebar-wrapper");
    expect(wrapper).toContain("group/sidebar-wrapper flex min-h-svh");
    expect(wrapper).toContain("--sidebar-width:224px");
    expect(wrapper).toContain("--sidebar-width-icon:3rem");
    expect(wrapper).toContain("--sidebar-animation-duration:250ms");
    const root = tag(html, "sidebar");
    expect(root).toContain('data-state="expanded"');
    expect(root).toMatch(/ data-collapsible[ >]/);
    expect(root).toContain('data-side="left"');
    expect(root).toContain('data-variant="sidebar"');
    expect(root).toContain("group peer hidden");
    expect(tag(html, "sidebar-gap")).toContain("group-data-[collapsible=offcanvas]:w-0");
    const container = tag(html, "sidebar-container");
    expect(container).toContain("fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width)");
    expect(container).toContain("group-data-[side=left]:border-r");
    expect(tag(html, "sidebar-inner")).toContain('data-sidebar="sidebar"');
    expect(tag(html, "sidebar-inset")).toMatch(/^<main /);
    expect(tag(html, "sidebar-inset")).toContain("relative flex w-full flex-1 flex-col");
    expect(tag(html, "sidebar-header")).toContain("flex flex-col gap-2 p-2");
    expect(tag(html, "sidebar-content")).toContain("sidebar-scrollbar");
    expect(tag(html, "sidebar-group-label")).toContain("text-muted-foreground");
    expect(tag(html, "sidebar-menu")).toMatch(/^<ul /);
    const link = tag(html, "sidebar-menu-button");
    expect(link).toMatch(/^<a /);
    expect(link).toMatch(/ data-active[ >]/);
    expect(link).toContain('data-size="default"');
    expect(link).toContain("data-active:bg-primary/10");
    const button = html.match(/<button[^>]*data-slot="sidebar-menu-button"[^>]*>/)?.[0] ?? "";
    expect(button).not.toMatch(/ data-active[ >=]/);
    expect(button).toContain('data-size="lg"');
    expect(button).toContain("shadow-[0_0_0_1px_var(--sidebar-border)]");
    const toggle = tag(html, "sidebar-trigger");
    expect(toggle).toContain('data-sidebar="trigger"');
    expect(toggle).toContain('data-variant="ghost"');
    expect(toggle).toContain('aria-expanded="true"');
    expect(html).toContain('<span class="sr-only">Toggle Sidebar</span>');
  });

  it("starts collapsed with defaultOpen false and sits on the right with side", async () => {
    const { html } = await Effect.runPromise(
      HtmlServer.renderToHtml(shell("Closed", { defaultOpen: false, side: "right" }), {}),
    );
    const root = tag(html, "sidebar");
    expect(root).toContain('data-state="collapsed"');
    expect(root).toContain('data-collapsible="offcanvas"');
    expect(root).toContain('data-side="right"');
    expect(tag(html, "sidebar-container")).toContain("data-closed");
    expect(tag(html, "sidebar-trigger")).toContain('aria-expanded="false"');
  });

  it("collapses from its trigger and Mod+B, keeping the page's state", () =>
    played(
      Effect.gen(function* () {
        const play = yield* HtmlPlay.make(shell("PlayedShell"), {});
        yield* play.type(search, "Design");
        yield* play.click(trigger);
        yield* play.expect(trigger).toHaveAttribute("aria-expanded", "false");
        yield* play.expect(sidebar).toHaveAttribute("data-state", "collapsed");
        yield* play.expect(sidebar).toHaveAttribute("data-collapsible", "offcanvas");
        yield* play.expect(search).toHaveValue("Design");
        yield* play.keydown("document", "b", { ctrl: true });
        yield* play.expect(sidebar).toHaveAttribute("data-state", "expanded");
        yield* play.keydown("document", "b", { meta: true });
        yield* play.expect(sidebar).toHaveAttribute("data-state", "collapsed");
      }),
    ));

  it("opens in a modal sheet below the breakpoint and keeps the page across it", () =>
    played(
      Effect.gen(function* () {
        const play = yield* HtmlPlay.make(shell("PlayedShell"), {});
        yield* play.type(search, "Design");
        yield* TestMediaQueries.set(sidebarMobileQuery, true);
        yield* play.expect(sheet).toBeAbsent();
        yield* play.expect(Locator.text("Omnisuite")).toBeAbsent();
        yield* play.expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
        yield* play.click(trigger);
        yield* play.expect(sheet).toExist();
        yield* play.expect(sidebar).toHaveAttribute("data-mobile", "true");
        yield* play.expect(sidebar).toHaveAttribute("data-side", "left");
        yield* play.expect(Locator.text("Omnisuite")).toExist();
        yield* play.keydown("document", "b", { ctrl: true, modal: true });
        yield* play.expect(sheet).toBeAbsent();
        yield* play.click(trigger);
        yield* play.expect(sheet).toExist();
        // Back on desktop the sheet is gone and the sidebar is as it was.
        yield* TestMediaQueries.set(sidebarMobileQuery, false);
        yield* play.expect(sheet).toBeAbsent();
        yield* play.expect(sidebar).toHaveAttribute("data-state", "expanded");
        yield* play.expect(search).toHaveValue("Design");
      }),
    ));
});
