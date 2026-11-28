import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { Toggle } from "@omnisuite/ui/effect/components/toggle";

const Message = UiSchema.TaggedEnum({ Changed: { checked: Schema.Boolean } });
export const toggleDemo = (
  example: "Default" | "Pressed" | "Disabled" | "Invalid" | "Sizes" | "Outline",
) =>
  Html.component({
    name: "ToggleDemo",
    model: Schema.Struct({ checked: Schema.Boolean }),
    message: Message,
  }).make({
    init: () => ({ checked: example === "Pressed" || example === "Disabled" }),
    update: { Changed: ($, { checked }) => $.evolve({ checked }) },
    view: (h, model) => {
      if (example === "Sizes")
        return h.div.class("flex items-center gap-3").children(
          (["xs", "sm", "default", "md", "lg"] as const).map((size) =>
            Toggle(h, {
              size,
              props: { pressed: model.checked },
              onToggle: ({ pressed }) => Message.Changed({ checked: pressed }),
            }).children(size),
          ),
        );
      return Toggle(h, {
        props: { pressed: model.checked, disabled: example === "Disabled" },
        onToggle: ({ pressed }) => Message.Changed({ checked: pressed }),
        variant: example === "Outline" ? "outline" : "default",
      })
        .attr("aria-invalid", example === "Invalid" ? "true" : undefined)
        .children("Notify members");
    },
  });
