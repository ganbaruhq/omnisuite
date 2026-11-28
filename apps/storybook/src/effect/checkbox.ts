import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { Checkbox } from "@omnisuite/ui/effect/components/checkbox";

const Message = UiSchema.TaggedEnum({ Changed: { checked: Schema.Boolean } });
export const checkboxDemo = (
  example: "Default" | "Checked" | "Disabled" | "Invalid" | "Indeterminate",
) =>
  Html.component({
    name: "CheckboxDemo",
    model: Schema.Struct({ checked: Schema.Boolean }),
    message: Message,
  }).make({
    init: () => ({ checked: example === "Checked" || example === "Disabled" }),
    update: { Changed: ($, { checked }) => $.evolve({ checked }) },
    view: (h, model) => {
      return h.label.class("flex items-center gap-2 text-sm").children(
        Checkbox(h, {
          props: {
            checked: model.checked,
            disabled: example === "Disabled",
            indeterminate: example === "Indeterminate",
          },
          onEmit: { Toggled: ({ checked }) => Message.Changed({ checked }) },
          view: (parts) =>
            parts
              .box(h)
              .attr("aria-label", "Notify members")
              .attr("aria-invalid", example === "Invalid" ? "true" : undefined),
        }),
        "Notify members",
      );
    },
  });
