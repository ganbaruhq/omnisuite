import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { HtmlLocator, HtmlPlay, HtmlScene } from "@effect/ui/html/testing";
import { TestHost } from "@effect/ui/testing";
import { Effect, Schema } from "effect";
import { describe, it } from "vite-plus/test";
import { Checkbox } from "@omnisuite/ui/effect/components/checkbox";

const Message = UiSchema.TaggedEnum({ Toggled: { checked: Schema.Boolean } });

const Terms = Html.component({
  name: "Terms",
  model: Schema.Struct({ agreed: Schema.Boolean }),
  message: Message,
}).make({
  init: () => ({ agreed: false }),
  update: { Toggled: ($, { checked }) => $.evolve({ agreed: () => checked }) },
  view: (h, model) =>
    h.div(
      Checkbox(h, {
        props: { checked: model.agreed },
        onEmit: { Toggled: ({ checked }) => Message.Toggled({ checked }) },
        view: (checkbox) => checkbox.box(h).attr("aria-label", "Agree"),
      }),
      h.p.children(model.agreed ? "Agreed" : "Not agreed"),
    ),
});

const agree = HtmlLocator.role("checkbox", { name: "Agree" });

describe("Effect Checkbox", () => {
  it("scene: shows the state its Toggled event asks for", () =>
    Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const s = yield* HtmlScene.make(Terms, {});
          s.expect(agree)
            .toHaveAttribute("data-slot", "checkbox")
            .expect(agree)
            .toHaveAttribute("aria-checked", "false")
            .childEmit(Checkbox.kit, { _tag: "Toggled", checked: true })
            .expect(agree)
            .toHaveAttribute("aria-checked", "true")
            .expect(agree)
            .toHaveAttribute("data-checked", "");
        }),
      ),
    ));

  it("play: a click toggles it through the kit", () =>
    Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const play = yield* HtmlPlay.make(Terms, {});
          yield* play.click(agree);
          yield* play.expect(agree).toHaveAttribute("aria-checked", "true");
          yield* play.click(agree);
          yield* play.expect(agree).toHaveAttribute("aria-checked", "false");
        }),
      ).pipe(Effect.provide(TestHost.layer())),
    ));
});
