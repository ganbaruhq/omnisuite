import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { ToggleGroup } from "@omnisuite/ui/effect/components/toggle-group";
const items = [
  { value: "list", label: "List" },
  { value: "grid", label: "Grid" },
  { value: "archived", label: "Archived", disabled: true },
];
const Message = UiSchema.TaggedEnum({ Toggled: { value: Schema.Array(Schema.String) } });
export const toggle_groupDemo = (
  example: "Default" | "Multiple" | "Disabled" | "Vertical" | "Outline" | "Joined" | "Sizes",
) =>
  Html.component({
    name: "ToggleGroupDemo",
    model: Schema.Struct({ value: Schema.Array(Schema.String) }),
    message: Message,
  }).make({
    init: () => ({ value: ["list"] }),
    update: { Toggled: ($, { value }) => $.evolve({ value }) },
    view: (h, model) => {
      const draw = (size: "xs" | "sm" | "default" | "md" | "lg") =>
        ToggleGroup(h, {
          key: size,
          props: {
            value: model.value,
            items,
            multiple: example === "Multiple",
            disabled: example === "Disabled",
            orientation: example === "Vertical" ? "vertical" : "horizontal",
          },
          onEmit: { Toggled: Message.Toggled },
          view: (group) =>
            group
              .control(h, {
                items,
                size,
                variant: example === "Outline" || example === "Joined" ? "outline" : "default",
                spacing: example === "Joined" ? 0 : 2,
              })
              .attr("aria-label", example === "Sizes" ? size : "View"),
        });
      return example === "Sizes"
        ? h.div
            .class("grid gap-3")
            .children((["xs", "sm", "default", "md", "lg"] as const).map(draw))
        : draw("default");
    },
  });
