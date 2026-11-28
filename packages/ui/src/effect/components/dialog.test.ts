import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { HtmlLocator, HtmlPlay, HtmlScene } from "@effect/ui/html/testing";
import { Locator, Story, TestHost } from "@effect/ui/testing";
import { Effect, Schema } from "effect";
import { describe, expect, it } from "vite-plus/test";
import { Button } from "@omnisuite/ui/effect/components/button";
import { Dialog } from "@omnisuite/ui/effect/components/dialog";

const Message = UiSchema.TaggedEnum({ SetOpen: { open: Schema.Boolean } });

const Confirm = Html.component({
  name: "Confirm",
  model: Schema.Struct({ open: Schema.Boolean }),
  message: Message,
}).make({
  init: () => ({ open: false }),
  update: { SetOpen: ($, { open }) => $.evolve({ open: () => open }) },
  view: (h, model) =>
    Dialog(h, {
      props: { open: model.open },
      onEmit: {
        RequestedOpen: () => Message.SetOpen({ open: true }),
        RequestedClose: () => Message.SetOpen({ open: false }),
        Settled: () => undefined,
      },
      view: (dialog) =>
        h.div(
          dialog.trigger(Button(h, { variant: "outline" })).children("Delete"),
          dialog.content(h, [
            dialog
              .header(h.div)
              .children(
                dialog.title(h.h2).children("Delete the collection?"),
                dialog.description(h.p).children("This can't be undone."),
              ),
            dialog
              .footer(h.div)
              .children(dialog.close(Button(h, { variant: "outline" })).children("Cancel")),
          ]),
        ),
    }),
});

const trigger = HtmlLocator.role("button", { name: "Delete" });
const dialogRole = HtmlLocator.role("dialog", { name: "Delete the collection?" });

describe("Effect Dialog", () => {
  it("story: the consumer owns open", () =>
    Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const s = yield* Story.make(Confirm, {});
          s.send(Message.SetOpen({ open: true }));
          expect(s.model.open).toBe(true);
        }),
      ),
    ));

  it("scene: draws the popup only while open, with our slots", () =>
    Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const s = yield* HtmlScene.make(Confirm, {});
          s.expect(dialogRole)
            .toBeAbsent()
            .childEmit(Dialog.kit, { _tag: "RequestedOpen", triggerId: null })
            .expect(dialogRole)
            .toExist()
            .expect(Locator.text("This can't be undone."))
            .toHaveAttribute("data-slot", "dialog-description")
            .expect(HtmlLocator.role("button", { name: "Close" }))
            .toExist();
        }),
      ),
    ));

  it("play: the trigger opens it and Cancel closes it", () =>
    Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const play = yield* HtmlPlay.make(Confirm, {});
          yield* play.click(trigger);
          yield* play.expect(dialogRole).toExist();
          yield* play.click(HtmlLocator.role("button", { name: "Cancel" }));
          yield* play.expect(dialogRole).toBeAbsent();
        }),
      ).pipe(Effect.provide(TestHost.layer())),
    ));
});
