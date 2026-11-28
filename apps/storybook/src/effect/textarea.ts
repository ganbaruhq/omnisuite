import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { Textarea } from "@omnisuite/ui/effect/components/textarea";

const Message = UiSchema.TaggedEnum({ Changed: { value: Schema.String } });
export const textareaDemo = (example: "Default" | "Disabled" | "Invalid" | "ReadOnly") =>
  Html.component({
    name: "TextareaDemo",
    model: Schema.Struct({ value: Schema.String }),
    message: Message,
  }).make({
    init: () => ({
      value: example === "Invalid" ? "Invalid name" : example === "ReadOnly" ? "Design system" : "",
    }),
    update: { Changed: ($, { value }) => $.evolve({ value }) },
    view: (h, model) => {
      return Textarea(h, {
        value: model.value,
        disabled: example === "Disabled",
        onUpdate: Message.Changed,
      }).attrs({
        "aria-label": "Description",
        placeholder: "Describe your collection",
        "aria-invalid": example === "Invalid" ? "true" : undefined,
        readonly: example === "ReadOnly" ? "" : undefined,
      });
    },
  });
