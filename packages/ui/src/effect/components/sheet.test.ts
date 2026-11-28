import { UiSchema } from "@effect/ui";
import { Html, HtmlServer } from "@effect/ui/html";
import { HtmlLocator, HtmlPlay, HtmlScene } from "@effect/ui/html/testing";
import { Locator, TestHost } from "@effect/ui/testing";
import { Effect, Schema } from "effect";
import { describe, expect, it } from "vite-plus/test";
import { Button } from "@omnisuite/ui/effect/components/button";
import type { DrawerSwipeDirection } from "@effect/ui-kit/Drawer";
import { Sheet } from "@omnisuite/ui/effect/components/sheet";

const Message = UiSchema.TaggedEnum({ SetOpen: { open: Schema.Boolean } });

const filters = (name: string, open: boolean, swipeDirection?: DrawerSwipeDirection) =>
  Html.component({
    name,
    model: Schema.Struct({ open: Schema.Boolean }),
    message: Message,
  }).make({
    init: () => ({ open }),
    update: { SetOpen: ($, { open }) => $.evolve({ open: () => open }) },
    view: (h, model) =>
      Sheet(h, {
        props:
          swipeDirection === undefined
            ? { open: model.open }
            : { open: model.open, swipeDirection },
        onEmit: {
          RequestedOpen: () => Message.SetOpen({ open: true }),
          RequestedClose: () => Message.SetOpen({ open: false }),
          Snapped: () => undefined,
          Settled: () => undefined,
        },
        view: (sheet) =>
          h.div(
            sheet.trigger(Button(h, { variant: "outline" })).children("Filters"),
            sheet.content(h, [
              sheet
                .header(h.div)
                .children(
                  sheet.title(h.h2).children("Filters"),
                  sheet.description(h.p).children("Narrow the list."),
                ),
              sheet
                .footer(h.div)
                .children(sheet.close(Button(h, { variant: "outline" })).children("Done")),
            ]),
          ),
      }),
  });

const tag = (html: string, slot: string) =>
  html.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? "";

const render = (component: ReturnType<typeof filters>) =>
  Effect.runPromise(HtmlServer.renderToHtml(component, {})).then(({ html }) => html);

const trigger = HtmlLocator.role("button", { name: "Filters" });
const dialogRole = HtmlLocator.role("dialog", { name: "Filters" });

describe("Effect Sheet", () => {
  it("sits on the right by default, swiping right to close, with React's classes", async () => {
    const html = await render(filters("RightFilters", true));

    const popup = tag(html, "sheet-content");
    expect(popup).toContain('data-side="right"');
    expect(popup).toContain('data-swipe-direction="right"');
    expect(popup).toContain("data-[side=right]:right-0");
    expect(popup).toContain("content-scrollbar max-h-dvh");
    // The kit moves the popup through these while a swipe runs.
    expect(popup).toContain("--drawer-swipe-movement-x");
    expect(tag(html, "sheet-overlay")).toContain("bg-black/80");
    expect(tag(html, "sheet-header")).toContain("flex flex-col gap-1.5 p-6");
    expect(tag(html, "sheet-footer")).toContain("mt-auto flex flex-col gap-2 p-6");
    expect(tag(html, "sheet-title")).toContain("font-semibold");
    const close = tag(html, "sheet-close");
    expect(close).toContain("absolute top-4 right-4");
    expect(html).toContain('<span class="sr-only">Close</span>');
  });

  it("sits on the edge it swipes toward, named as React's side", async () => {
    const sides = [
      ["left", "left"],
      ["top", "up"],
      ["bottom", "down"],
    ] as const;
    for (const [side, direction] of sides) {
      const popup = tag(await render(filters(`Filters-${side}`, true, direction)), "sheet-content");
      expect(popup).toContain(`data-side="${side}"`);
      expect(popup).toContain(`data-swipe-direction="${direction}"`);
    }
  });

  it("draws the popup only while open, and maps the kit's events", () =>
    Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const s = yield* HtmlScene.make(filters("Filters", false), {});
          s.expect(dialogRole)
            .toBeAbsent()
            .expect(trigger)
            .toHaveAttribute("data-slot", "sheet-trigger")
            .childEmit(Sheet.kit, {
              _tag: "RequestedOpen",
              triggerId: null,
              reason: "trigger-press",
            })
            .expect(dialogRole)
            .toExist()
            .expect(Locator.text("Narrow the list."))
            .toHaveAttribute("data-slot", "sheet-description")
            .childEmit(Sheet.kit, { _tag: "RequestedClose", reason: "swipe" })
            .expect(dialogRole)
            .toBeAbsent();
        }),
      ),
    ));

  it("opens from its trigger and closes from its close buttons", () =>
    Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const play = yield* HtmlPlay.make(filters("Filters", false), {});
          yield* play.click(trigger);
          yield* play.expect(dialogRole).toExist();
          yield* play.click(HtmlLocator.role("button", { name: "Done" }));
          yield* play.expect(dialogRole).toBeAbsent();
          yield* play.click(trigger);
          yield* play.click(HtmlLocator.role("button", { name: "Close" }));
          yield* play.expect(dialogRole).toBeAbsent();
        }),
      ).pipe(Effect.provide(TestHost.layer())),
    ));
});
