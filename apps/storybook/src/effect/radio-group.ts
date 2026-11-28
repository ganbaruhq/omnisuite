import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { RadioGroup } from "@omnisuite/ui/effect/components/radio-group";
const items = [
  { value: "list", label: "List" },
  { value: "grid", label: "Grid" },
  { value: "archived", label: "Archived", disabled: true },
];
const Message = UiSchema.TaggedEnum({ Picked: { value: Schema.String } });
export const radio_groupDemo = (example: "Default" | "Disabled" | "Invalid" | "Horizontal") =>
  Html.component({
    name: "RadioGroupDemo",
    model: Schema.Struct({ value: Schema.String }),
    message: Message,
  }).make({
    init: () => ({ value: "list" }),
    update: { Picked: ($, { value }) => $.evolve({ value }) },
    view: (h, model) => {
      return RadioGroup(h, {
        props: {
          value: model.value,
          items,
          disabled: example === "Disabled",
          invalid: example === "Invalid",
        },
        onEmit: { Picked: Message.Picked },
        view: (radio) =>
          radio
            .root(h.div)
            .attr("aria-label", "View")
            .class(example === "Horizontal" ? "flex gap-4" : "grid gap-2")
            .children(
              items.map((item) =>
                h.label
                  .class("flex items-center gap-2 text-sm")
                  .children(
                    radio.option(h, { value: item.value }).attr("aria-label", item.label),
                    item.label,
                  ),
              ),
            ),
      });
    },
  });
