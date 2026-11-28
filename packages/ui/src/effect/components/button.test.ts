import { UiSchema } from "@effect/ui";
import { Html, HtmlServer } from "@effect/ui/html";
import { HtmlLocator, HtmlScene } from "@effect/ui/html/testing";
import { Effect, Schema } from "effect";
import { describe, expect, it } from "vite-plus/test";
import { Button } from "@omnisuite/ui/effect/components/button";

const Message = UiSchema.TaggedEnum({ Pressed: {} });

const Counter = Html.component({
  name: "Counter",
  model: Schema.Struct({ presses: Schema.Number }),
  message: Message,
}).make({
  init: () => ({ presses: 0 }),
  update: { Pressed: ($) => $.evolve({ presses: (presses) => presses + 1 }) },
  view: (h, model) =>
    h.div(
      Button(h, { variant: "outline", size: "lg", onPress: Message.Pressed() })
        .class("px-6")
        .children(`Pressed ${model.presses}`),
    ),
});

const run = <A, E>(effect: Effect.Effect<A, E, never>) => Effect.runPromise(effect);

describe("Effect Button", () => {
  it("merges our variant classes under the caller's", async () => {
    const { html } = await run(HtmlServer.renderToHtml(Counter, {}));
    const button = /<button[^>]*>/.exec(html)?.[0] ?? "";
    expect(button).toContain('data-slot="button"');
    expect(button).toContain('data-variant="outline"');
    expect(button).toContain('data-size="lg"');
    expect(button).toContain('type="button"');
    expect(button).toContain("border-border");
    // `px-6` from the caller replaces the `lg` size's `px-3.5`.
    expect(button).toContain("px-6");
    expect(button).not.toContain("px-3.5");
  });

  it("sends onPress when clicked", () =>
    run(
      Effect.scoped(
        Effect.gen(function* () {
          const s = yield* HtmlScene.make(Counter, {});
          s.click(HtmlLocator.role("button", { name: "Pressed 0" }))
            .expect(HtmlLocator.role("button", { name: "Pressed 1" }))
            .toExist();
        }),
      ),
    ));
});
