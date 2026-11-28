import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { HtmlLocator, HtmlScene } from "@effect/ui/html/testing";
import { Locator } from "@effect/ui/testing";
import { Effect, Schema } from "effect";
import { it } from "vite-plus/test";
import { Slider } from "@omnisuite/ui/effect/components/slider";

const Message = UiSchema.TaggedEnum({
  Moved: { value: Schema.Union([Schema.Number, Schema.Array(Schema.Number)]) },
  Committed: { value: Schema.Union([Schema.Number, Schema.Array(Schema.Number)]) },
});
const Example = Html.component({
  name: "SliderExample",
  model: Schema.Struct({
    value: Schema.Union([Schema.Number, Schema.Array(Schema.Number)]),
    committed: Schema.Union([Schema.Number, Schema.Array(Schema.Number)]),
  }),
  message: Message,
}).make({
  init: () => ({ value: [20, 80], committed: 0 }),
  update: {
    Moved: ($, { value }) => $.evolve({ value: () => value }),
    Committed: ($, { value }) => $.evolve({ committed: () => value }),
  },
  view: (h, model) =>
    h.div(
      Slider(h, {
        props: { value: model.value, min: 0, max: 100, orientation: "vertical", disabled: true },
        onEmit: { Moved: Message.Moved, Committed: Message.Committed },
        view: (slider) => slider.controlWithThumbs(h, { labels: ["Minimum", "Maximum"] }),
      }),
      h.output.attr("aria-label", "Committed").children(String(model.committed)),
    ),
});

it("Slider draws every range thumb with ARIA and maps Moved and Committed independently", () =>
  Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const scene = yield* HtmlScene.make(Example, {});
        const min = HtmlLocator.role("slider", { name: "Minimum" });
        const max = HtmlLocator.role("slider", { name: "Maximum" });
        scene
          .expect(min)
          .toHaveAttribute("aria-valuenow", "20")
          .expect(max)
          .toHaveAttribute("aria-valuenow", "80")
          .expect(min)
          .toHaveAttribute("aria-orientation", "vertical")
          .expect(min)
          .toHaveAttribute("disabled", "")
          .expect(Locator.attr("data-slot", "slider-control"))
          .toHaveAttribute("class", /data-\[orientation=vertical\]:min-h-40/)
          .expect(Locator.attr("data-index", "0"))
          .toHaveAttribute("class", /bottom-\(--slider-thumb-position\)/)
          .childEmit(Slider.kit, { _tag: "Moved", value: [30, 70] })
          .expect(min)
          .toHaveAttribute("aria-valuenow", "30")
          .expect(max)
          .toHaveAttribute("aria-valuenow", "70")
          .childEmit(Slider.kit, { _tag: "Committed", value: [30, 70] })
          .expect(HtmlLocator.role("status", { name: "Committed" }))
          .toHaveText("30,70");
      }),
    ),
  ));
