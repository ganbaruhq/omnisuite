import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { Field, FieldContent } from "@omnisuite/ui/effect/components/field";
import { Input } from "@omnisuite/ui/effect/components/input";

const Message = UiSchema.TaggedEnum({ Changed: { value: Schema.String } });
export const fieldDemo = (
  example: "Default" | "Horizontal" | "Responsive" | "Disabled" | "Invalid",
) =>
  Html.component({
    name: "FieldDemo",
    model: Schema.Struct({ value: Schema.String }),
    message: Message,
  }).make({
    init: () => ({ value: "" }),
    update: { Changed: ($, { value }) => $.evolve({ value }) },
    view: (h, model) => {
      return Field(h, {
        props: {
          invalid: example === "Invalid",
          disabled: example === "Disabled",
          described: true,
        },
        view: (field) =>
          field
            .root(
              h.div,
              example === "Horizontal"
                ? "horizontal"
                : example === "Responsive"
                  ? "responsive"
                  : "vertical",
            )
            .class("w-80")
            .children(
              FieldContent(h).children(
                field.label(h.label).children("Collection name"),
                field.description(h.p).children("Visible to your team."),
              ),
              Input(h, {
                element: field.control(h.input),
                props: { value: model.value, disabled: field.disabled },
                onUpdate: Message.Changed,
              }).attr("placeholder", "Design system"),
              field.errors(h, example === "Invalid" ? ["Give the collection a name"] : []),
            ),
      });
    },
  });
