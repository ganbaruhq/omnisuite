import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { Slider } from "@omnisuite/ui/effect/components/slider";

const Message = UiSchema.TaggedEnum({ Moved: { value: Schema.Array(Schema.Number) } });
export const sliderDemo = (example: "Default" | "Range" | "Disabled" | "Vertical") =>
  Html.component({
    name: "SliderDemo",
    model: Schema.Struct({ value: Schema.Array(Schema.Number) }),
    message: Message,
  }).make({
    init: () => ({ value: example === "Range" ? [20, 80] : [40] }),
    update: { Moved: ($, { value }) => $.evolve({ value }) },
    view: (h, model) => {
      return Slider(h, {
        props: {
          value: model.value,
          min: 0,
          max: 100,
          disabled: example === "Disabled",
          orientation: example === "Vertical" ? "vertical" : "horizontal",
        },
        onEmit: {
          Moved: ({ value }) =>
            Message.Moved({ value: typeof value === "number" ? [value] : [...value] }),
          Committed: () => undefined,
        },
        view: (slider) =>
          slider
            .controlWithThumbs(h, {
              labels:
                model.value.length === 1 ? ["Capacity"] : ["Minimum capacity", "Maximum capacity"],
            })
            .class(example === "Vertical" ? "h-48" : "w-72"),
      });
    },
  });
