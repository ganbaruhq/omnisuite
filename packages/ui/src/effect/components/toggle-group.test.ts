import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { HtmlLocator, HtmlScene } from "@effect/ui/html/testing";
import { Effect, Schema } from "effect";
import { it } from "vite-plus/test";
import { ToggleGroup } from "@omnisuite/ui/effect/components/toggle-group";

const Message = UiSchema.TaggedEnum({ Toggled: { value: Schema.Array(Schema.String) } });
const items = [
  { value: "List", label: "List" },
  { value: "Grid", label: "Grid" },
  { value: "Board", label: "Board", disabled: true },
];
const Example = Html.component({
  name: "ToggleGroupExample",
  model: Schema.Struct({ value: Schema.Array(Schema.String) }),
  message: Message,
}).make({
  init: () => ({ value: ["List"] }),
  update: { Toggled: ($, { value }) => $.evolve({ value: () => value }) },
  view: (h, model) =>
    ToggleGroup(h, {
      props: { value: model.value, items, orientation: "vertical", multiple: true },
      onEmit: { Toggled: Message.Toggled },
      view: (group) =>
        group
          .control(h, { items, variant: "outline", size: "sm", spacing: 0 })
          .class("gap-4")
          .attr("aria-label", "Views"),
    }),
});

it("ToggleGroup maps Toggled to multiple pressed buttons with disabled and orientation states", () =>
  Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const scene = yield* HtmlScene.make(Example, {});
        const grid = HtmlLocator.role("button", { name: "Grid" });
        scene
          .expect(HtmlLocator.role("group", { name: "Views" }))
          .toHaveAttribute("data-orientation", "vertical")
          .expect(grid)
          .toHaveAttribute("aria-pressed", "false")
          .expect(grid)
          .toHaveAttribute("data-size", "sm")
          .expect(grid)
          .toHaveAttribute("data-spacing", "0")
          .expect(grid)
          .toHaveAttribute("class", /group-data-\[orientation=vertical\]/)
          .expect(HtmlLocator.role("group", { name: "Views" }))
          .toHaveAttribute("class", /gap-4/)
          .childEmit(ToggleGroup.kit, { _tag: "Toggled", value: ["List", "Grid"] })
          .expect(grid)
          .toHaveAttribute("aria-pressed", "true")
          .expect(grid)
          .toHaveAttribute("data-pressed", "")
          .expect(HtmlLocator.role("button", { name: "List" }))
          .toHaveAttribute("aria-pressed", "true")
          .expect(HtmlLocator.role("button", { name: "Board" }))
          .toHaveAttribute("disabled", "");
      }),
    ),
  ));
