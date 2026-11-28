import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { Input } from "@omnisuite/ui/effect/components/input";

const Message = UiSchema.TaggedEnum({ Changed: { value: Schema.String } });
export const inputDemo = (example: "Default" | "Disabled" | "Invalid" | "ReadOnly" | "Sizes") =>
  Html.component({
    name: "InputDemo",
    model: Schema.Struct({ value: Schema.String }),
    message: Message,
  }).make({
    init: () => ({
      value: example === "Invalid" ? "Invalid name" : example === "ReadOnly" ? "Design system" : "",
    }),
    update: { Changed: ($, { value }) => $.evolve({ value }) },
    view: (h, model) => {
      const disabled = example === "Disabled",
        invalid = example === "Invalid",
        readOnly = example === "ReadOnly";
      if (example === "Sizes")
        return h.div.class("grid w-64 gap-3").children(
          (["xs", "sm", "default", "md", "lg"] as const).map((size) =>
            Input(h, { props: { value: model.value, disabled }, onUpdate: Message.Changed })
              .attr("readonly", readOnly ? "" : undefined)
              .attrs({
                "aria-label": "Collection name",
                placeholder: "Collection name",
                "aria-invalid": invalid ? "true" : undefined,
              })
              .attr("data-size", size)
              .attr("aria-label", size)
              .attr("placeholder", size),
          ),
        );
      return Input(h, { props: { value: model.value, disabled }, onUpdate: Message.Changed })
        .attr("readonly", readOnly ? "" : undefined)
        .attrs({
          "aria-label": "Collection name",
          placeholder: "Collection name",
          "aria-invalid": invalid ? "true" : undefined,
        });
    },
  });
