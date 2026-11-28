import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { HtmlLocator, HtmlScene } from "@effect/ui/html/testing";
import { Effect, Schema } from "effect";
import { it } from "vite-plus/test";
import { RadioGroup } from "@omnisuite/ui/effect/components/radio-group";

const Message = UiSchema.TaggedEnum({ Picked: { value: Schema.String } });
const items = [{ value: "private" }, { value: "team" }, { value: "public", disabled: true }];
const Example = Html.component({
  name: "RadioExample",
  model: Schema.Struct({ value: Schema.String }),
  message: Message,
}).make({
  init: () => ({ value: "private" }),
  update: { Picked: ($, { value }) => $.evolve({ value: () => value }) },
  view: (h, model) =>
    RadioGroup(h, {
      props: { value: model.value, items, invalid: true },
      onEmit: { Picked: Message.Picked },
      view: (radio) =>
        radio
          .root(h.div)
          .attr("aria-label", "Visibility")
          .children(
            items.map(({ value }) =>
              radio.option(h, { value }).class("size-6").attr("aria-label", value),
            ),
          ),
    }),
});

it("RadioGroup maps Picked to checked radios and exposes group validity and disabled items", () =>
  Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const scene = yield* HtmlScene.make(Example, {});
        const team = HtmlLocator.role("radio", { name: "team" });
        scene
          .expect(HtmlLocator.role("radiogroup", { name: "Visibility" }))
          .toHaveAttribute("aria-invalid", "true")
          .expect(team)
          .toHaveAttribute("aria-checked", "false")
          .expect(team)
          .toHaveAttribute("data-slot", "radio-group-item")
          .expect(team)
          .toHaveAttribute("class", /size-6/)
          .expect(team)
          .toHaveAttribute("class", /data-checked:bg-primary/)
          .childEmit(RadioGroup.kit, { _tag: "Picked", value: "team" })
          .expect(team)
          .toHaveAttribute("aria-checked", "true")
          .expect(team)
          .toHaveAttribute("data-checked", "")
          .expect(HtmlLocator.role("radio", { name: "private" }))
          .toHaveAttribute("aria-checked", "false")
          .expect(HtmlLocator.role("radio", { name: "public" }))
          .toHaveAttribute("disabled", "");
      }),
    ),
  ));
