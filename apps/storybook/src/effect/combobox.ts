import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { Combobox } from "@omnisuite/ui/effect/components/combobox";
const items = [
  { value: "design", label: "Design" },
  { value: "engineering", label: "Engineering" },
  { value: "archived", label: "Archived", disabled: true },
];
const Message = UiSchema.TaggedEnum({
  Picked: { value: Schema.NullOr(Schema.Union([Schema.String, Schema.Array(Schema.String)])) },
  Typed: { inputValue: Schema.String },
  SetOpen: { open: Schema.Boolean, size: Schema.String },
});
export const comboboxDemo = (
  example: "Default" | "Open" | "Disabled" | "Invalid" | "Empty" | "Multiple" | "Sizes",
) =>
  Html.component({
    name: "ComboboxDemo",
    model: Schema.Struct({
      value: Schema.NullOr(Schema.Union([Schema.String, Schema.Array(Schema.String)])),
      query: Schema.String,
      open: Schema.NullOr(Schema.String),
    }),
    message: Message,
  }).make({
    init: () => ({
      value: example === "Multiple" ? ["design"] : "design",
      query: example === "Empty" ? "No match" : example === "Multiple" ? "" : "Design",
      open: example === "Open" || example === "Empty" ? "default" : null,
    }),
    update: {
      Picked: ($, { value }) => $.evolve({ value }),
      Typed: ($, { inputValue }) => $.evolve({ query: inputValue }),
      SetOpen: ($, { open, size }) => $.evolve({ open: open ? size : null }),
    },
    view: (h, model) => {
      const draw = (size: "xs" | "sm" | "default" | "md" | "lg") =>
        Combobox(h, {
          key: size,
          props: {
            items,
            value: model.value,
            inputValue: model.query,
            open: model.open === size,
            multiple: example === "Multiple",
            disabled: example === "Disabled",
          },
          onEmit: {
            Picked: Message.Picked,
            RequestedInputValue: Message.Typed,
            RequestedOpen: () => Message.SetOpen({ open: true, size }),
            RequestedClose: () => Message.SetOpen({ open: false, size }),
            Highlighted: () => undefined,
            Settled: () => undefined,
          },
          view: (combo) =>
            h.div.class("w-64").children(
              example === "Multiple"
                ? combo.chips(h.div).children(
                    combo.selectedItems.map((item) => combo.chipWithRemove(h, item)),
                    combo.chipsInput(h.input).attr("aria-label", "Owner"),
                  )
                : combo.control(h, {
                    label: example === "Sizes" ? size : "Owner",
                    size,
                    showClear: true,
                    element: h.input.attr(
                      "aria-invalid",
                      example === "Invalid" ? "true" : undefined,
                    ),
                  }),
              combo.content(
                h,
                combo.items.map((item) => combo.option(h, item)),
              ),
            ),
        });
      return example === "Sizes"
        ? h.div
            .class("grid gap-3")
            .children((["xs", "sm", "default", "md", "lg"] as const).map(draw))
        : draw("default");
    },
  });
