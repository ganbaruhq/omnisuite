import { UiSchema } from "@effect/ui";
import { Html, HtmlServer } from "@effect/ui/html";
import { HtmlLocator, HtmlPlay, HtmlScene } from "@effect/ui/html/testing";
import { Locator, TestHost } from "@effect/ui/testing";
import { DrawerSnapPoint, type DrawerProps } from "@effect/ui-kit/Drawer";
import { Effect, Schema } from "effect";
import { describe, expect, it } from "vite-plus/test";
import { Button } from "@omnisuite/ui/effect/components/button";
import { Drawer } from "@omnisuite/ui/effect/components/drawer";

const Message = UiSchema.TaggedEnum({
  SetOpen: { open: Schema.Boolean },
  Snapped: { snapPoint: DrawerSnapPoint },
});

type Options = Partial<Omit<DrawerProps, "open">>;

const details = (name: string, open: boolean, options: Options = {}) =>
  Html.component({
    name,
    model: Schema.Struct({ open: Schema.Boolean, snapPoint: Schema.NullOr(DrawerSnapPoint) }),
    message: Message,
  }).make({
    init: () => ({ open, snapPoint: null }),
    update: {
      SetOpen: ($, { open }) => $.evolve({ open: () => open }),
      Snapped: ($, { snapPoint }) => $.evolve({ snapPoint: () => snapPoint }),
    },
    view: (h, model) =>
      Drawer(h, {
        props: { ...options, open: model.open, snapPoint: model.snapPoint },
        onEmit: {
          RequestedOpen: () => Message.SetOpen({ open: true }),
          RequestedClose: () => Message.SetOpen({ open: false }),
          Snapped: ({ snapPoint }) => Message.Snapped({ snapPoint }),
          Settled: () => undefined,
        },
        view: (drawer) =>
          h.div(
            drawer.trigger(Button(h, { variant: "outline" })).children("Details"),
            h.p.children(`Snapped to ${model.snapPoint ?? "none"}`),
            drawer.content(
              h,
              [
                drawer
                  .header(h.div)
                  .children(
                    drawer.title(h.h2).children("Release notes"),
                    drawer.description(h.p).children("What changed this week."),
                  ),
                drawer.body(h.div).children("Notes"),
                drawer
                  .footer(h.div)
                  .children(drawer.close(Button(h, { variant: "outline" })).children("Done")),
              ],
              { showSwipeHandle: true },
            ),
          ),
      }),
  });

const tag = (html: string, slot: string) =>
  html.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? "";

const render = (component: ReturnType<typeof details>) =>
  Effect.runPromise(HtmlServer.renderToHtml(component, {})).then(({ html }) => html);

// The attribute, not the classes' `data-snap-points:` variants.
const snapPointsAttribute = / data-snap-points[ =>]/;

const trigger = HtmlLocator.role("button", { name: "Details" });
const dialogRole = HtmlLocator.role("dialog", { name: "Release notes" });

describe("Effect Drawer", () => {
  it("draws React's bottom drawer: overlay, viewport, popup, handle and content", async () => {
    const html = await render(details("BottomDrawer", true, { snapPoints: [0.5, 1] }));

    const popup = tag(html, "drawer-popup");
    expect(popup).toContain('data-swipe-direction="down"');
    expect(popup).toContain('data-swipe-axis="y"');
    expect(popup).toMatch(snapPointsAttribute);
    expect(popup).toContain("group/drawer-popup");
    expect(popup).toContain("data-[swipe-direction=down]:bottom-0");
    // The kit sets the swipe's progress only on the backdrop; without it the popup's transform,
    // and with it the swipe's movement, computes to `none`.
    expect(popup).toContain("[--drawer-swipe-progress:0]");
    const overlay = tag(html, "drawer-overlay");
    expect(overlay).toMatch(snapPointsAttribute);
    expect(overlay).toContain("bg-black/80");
    const viewport = tag(html, "drawer-viewport");
    expect(viewport).toContain('data-modal="true"');
    expect(viewport).toContain("data-[modal=true]:pointer-events-auto");
    expect(tag(html, "drawer-swipe-handle")).toContain('aria-hidden="true"');
    expect(tag(html, "drawer-content")).toContain("group/drawer-content");
    expect(tag(html, "drawer-header")).toContain("flex shrink-0 flex-col gap-1 p-4 pb-0");
    expect(tag(html, "drawer-body")).toContain("content-scrollbar min-h-0 flex-1");
    expect(tag(html, "drawer-footer")).toContain("mt-auto flex shrink-0");
    expect(tag(html, "drawer-description")).toContain("text-balance");
  });

  it("has no overlay unless modal, and a sideways axis for a side drawer", async () => {
    const html = await render(
      details("SideDrawer", true, { modal: false, swipeDirection: "right" }),
    );

    expect(html).not.toContain('data-slot="drawer-overlay"');
    expect(tag(html, "drawer-viewport")).toContain('data-modal="false"');
    const popup = tag(html, "drawer-popup");
    expect(popup).toContain('data-swipe-axis="x"');
    expect(popup).not.toMatch(snapPointsAttribute);
  });

  it("draws the popup only while open, and maps the kit's events", () =>
    Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const s = yield* HtmlScene.make(details("Details", false), {});
          s.expect(dialogRole)
            .toBeAbsent()
            .expect(trigger)
            .toHaveAttribute("data-slot", "drawer-trigger")
            .childEmit(Drawer.kit, { _tag: "RequestedOpen", triggerId: null, reason: "swipe" })
            .expect(dialogRole)
            .toExist()
            .expect(Locator.text("Release notes"))
            .toHaveAttribute("data-slot", "drawer-title")
            .childEmit(Drawer.kit, { _tag: "Snapped", snapPoint: 1 })
            .expect(Locator.text("Snapped to 1"))
            .toExist()
            .childEmit(Drawer.kit, { _tag: "RequestedClose", reason: "swipe" })
            .expect(dialogRole)
            .toBeAbsent();
        }),
      ),
    ));

  it("opens from its trigger and closes from its close button", () =>
    Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const play = yield* HtmlPlay.make(details("Details", false), {});
          yield* play.click(trigger);
          yield* play.expect(dialogRole).toExist();
          yield* play.click(HtmlLocator.role("button", { name: "Done" }));
          yield* play.expect(dialogRole).toBeAbsent();
        }),
      ).pipe(Effect.provide(TestHost.layer())),
    ));
});
