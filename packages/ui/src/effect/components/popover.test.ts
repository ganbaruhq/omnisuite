import { UiSchema } from "@effect/ui";
import { Html, HtmlServer } from "@effect/ui/html";
import { HtmlLocator, HtmlPlay, HtmlScene } from "@effect/ui/html/testing";
import { Locator, TestHost } from "@effect/ui/testing";
import { Effect, Schema } from "effect";
import { describe, expect, it } from "vite-plus/test";
import { Button } from "@omnisuite/ui/effect/components/button";
import { Popover } from "@omnisuite/ui/effect/components/popover";

const Message = UiSchema.TaggedEnum({ SetOpen: { open: Schema.Boolean } });

const Help = Html.component({
  name: "Help",
  model: Schema.Struct({ open: Schema.Boolean }),
  message: Message,
}).make({
  init: () => ({ open: false }),
  update: { SetOpen: ($, { open }) => $.evolve({ open: () => open }) },
  view: (h, model) =>
    Popover(h, {
      props: { open: model.open },
      onEmit: {
        RequestedOpen: () => Message.SetOpen({ open: true }),
        RequestedClose: () => Message.SetOpen({ open: false }),
        Settled: () => undefined,
      },
      view: (popover) =>
        h.div(
          popover.trigger({ element: Button(h, { variant: "outline" }) }).children("Filters help"),
          popover.content(h, [
            popover
              .header(h.div)
              .children(
                popover.title(h.h2).children("About filters"),
                popover.description(h.p).children("Filters narrow the list."),
              ),
            popover.close(Button(h, { variant: "outline" })).children("Got it"),
          ]),
        ),
    }),
});

const trigger = HtmlLocator.role("button", { name: "Filters help" });
const dialogRole = HtmlLocator.role("dialog", { name: "About filters" });

const tag = (html: string, slot: string) =>
  html.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? "";

describe("Effect Popover", () => {
  it("draws its popup only while open, with React's slots and classes", () =>
    Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const s = yield* HtmlScene.make(Help, {});
          s.expect(dialogRole)
            .toBeAbsent()
            .expect(trigger)
            .toHaveAttribute("data-slot", "popover-trigger")
            .childEmit(Popover.kit, {
              _tag: "RequestedOpen",
              triggerId: null,
              reason: "trigger-press",
            })
            .expect(dialogRole)
            .toExist()
            .expect(Locator.text("About filters"))
            .toHaveAttribute("data-slot", "popover-title")
            .expect(Locator.text("Filters narrow the list."))
            .toHaveAttribute("data-slot", "popover-description")
            .childEmit(Popover.kit, { _tag: "RequestedClose", reason: "escape-key" })
            .expect(dialogRole)
            .toBeAbsent();
        }),
      ),
    ));

  it("resets the positioner's popover box and styles the popup as React's", async () => {
    const OpenHelp = Html.component({
      name: "OpenHelp",
      model: Schema.Struct({}),
      message: Schema.Never,
    }).make({
      init: () => ({}),
      update: ($) => $.model,
      view: (h) =>
        Popover(h, {
          props: { open: true },
          onEmit: {
            RequestedOpen: () => undefined,
            RequestedClose: () => undefined,
            Settled: () => undefined,
          },
          view: (popover) =>
            h.div(
              popover.trigger({ element: h.button }).children("Open"),
              popover
                .portal(h.dialog)
                ?.children(
                  popover
                    .positioner(h.div)
                    .children(popover.popup(h.div.class("w-96")).children("Body")),
                ),
            ),
        }),
    });
    const { html } = await Effect.runPromise(HtmlServer.renderToHtml(OpenHelp, {}));

    const positioner = tag(html, "popover-positioner");
    expect(positioner).toContain("isolate z-50");
    expect(positioner).toContain("border-0 bg-transparent p-0");
    const popup = tag(html, "popover-content");
    expect(popup).toContain("rounded-lg bg-popover p-2.5");
    // React's side: below the trigger.
    expect(popup).toContain('data-side="bottom"');
    // A caller's class wins over ours.
    expect(popup).toContain("w-96");
    expect(popup).not.toContain("w-72");
  });

  it("opens from its trigger and closes from its close button", () =>
    Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const play = yield* HtmlPlay.make(Help, {});
          yield* play.click(trigger);
          yield* play.expect(dialogRole).toExist();
          yield* play.click(HtmlLocator.role("button", { name: "Got it" }));
          yield* play.expect(dialogRole).toBeAbsent();
        }),
      ).pipe(Effect.provide(TestHost.layer())),
    ));
});
