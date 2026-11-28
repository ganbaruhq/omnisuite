import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { HtmlLocator, HtmlPlay } from "@effect/ui/html/testing";
import { TestHost } from "@effect/ui/testing";
import { Effect, Schema } from "effect";
import { it } from "vite-plus/test";
import { Toggle } from "@omnisuite/ui/effect/components/toggle";

const Message = UiSchema.TaggedEnum({ Toggled: { pressed: Schema.Boolean } });
const Example = Html.component({
  name: "ToggleExample",
  model: Schema.Struct({ pressed: Schema.Boolean }),
  message: Message,
}).make({
  init: () => ({ pressed: false }),
  update: { Toggled: ($, { pressed }) => $.evolve({ pressed: () => pressed }) },
  view: (h, model) =>
    h.div(
      Toggle(h, {
        variant: "outline",
        size: "sm",
        props: { pressed: model.pressed },
        onToggle: Message.Toggled,
      })
        .class("h-10")
        .children("Pin"),
      Toggle(h, { props: { pressed: false, disabled: true }, onToggle: Message.Toggled }).children(
        "Disabled",
      ),
    ),
});

it("Toggle maps onToggle to controlled pressed state and preserves disabled ARIA", () =>
  Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const play = yield* HtmlPlay.make(Example, {});
        const pin = HtmlLocator.role("button", { name: "Pin" });
        yield* play.expect(pin).toHaveAttribute("aria-pressed", "false");
        yield* play.expect(pin).toHaveAttribute("data-slot", "toggle");
        yield* play.expect(pin).toHaveAttribute("data-variant", "outline");
        yield* play.expect(pin).toHaveAttribute("class", /h-10/);
        yield* play.expect(pin).toHaveAttribute("class", /aria-pressed:bg-muted/);
        yield* play.click(pin);
        yield* play.expect(pin).toHaveAttribute("aria-pressed", "true");
        yield* play.expect(pin).toHaveAttribute("data-pressed", "");
        const disabled = HtmlLocator.role("button", { name: "Disabled" });
        yield* play.expect(disabled).toHaveAttribute("disabled", "");
        yield* play.expect(disabled).toHaveAttribute("data-disabled", "");
        yield* play.expect(pin).toHaveAttribute("aria-pressed", "true");
      }),
    ).pipe(Effect.provide(TestHost.layer())),
  ));
