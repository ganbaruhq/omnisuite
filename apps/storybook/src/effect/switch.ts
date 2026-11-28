import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { Switch } from "@omnisuite/ui/effect/components/switch";

const Message = UiSchema.TaggedEnum({ Changed: { checked: Schema.Boolean } });
export const switchDemo = (example: "Default" | "Checked" | "Disabled" | "Invalid" | "Sizes") =>
  Html.component({
    name: "SwitchDemo",
    model: Schema.Struct({ checked: Schema.Boolean }),
    message: Message,
  }).make({
    init: () => ({ checked: example === "Checked" || example === "Disabled" }),
    update: { Changed: ($, { checked }) => $.evolve({ checked }) },
    view: (h, model) => {
      if (example === "Sizes")
        return h.div.class("flex items-center gap-4").children(
          (["sm", "default"] as const).map((size) =>
            Switch(h, {
              size,
              props: { checked: model.checked },
              onToggle: Message.Changed,
              view: (parts) => parts.box(h).attr("aria-label", size),
            }),
          ),
        );
      return h.label.class("flex items-center gap-2 text-sm").children(
        Switch(h, {
          props: { checked: model.checked, disabled: example === "Disabled" },
          onToggle: Message.Changed,
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
