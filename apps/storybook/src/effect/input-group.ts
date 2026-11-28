import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupText,
  InputGroupButton,
  InputGroupTextarea,
} from "@omnisuite/ui/effect/components/input-group";

const Message = UiSchema.TaggedEnum({ Changed: { value: Schema.String } });
export const input_groupDemo = (
  example: "Default" | "Disabled" | "Invalid" | "Sizes" | "Multiline",
) =>
  Html.component({
    name: "InputGroupDemo",
    model: Schema.Struct({ value: Schema.String }),
    message: Message,
  }).make({
    init: () => ({ value: "" }),
    update: { Changed: ($, { value }) => $.evolve({ value }) },
    view: (h, model) => {
      const disabled = example === "Disabled",
        invalid = example === "Invalid";
      if (example === "Multiline")
        return InputGroup(h)
          .class("w-72")
          .children(
            InputGroupTextarea(h, { value: model.value, onUpdate: Message.Changed }).attrs({
              "aria-label": "Message",
              placeholder: "Write a message",
            }),
            InputGroupAddon(h, { align: "block-start" }).children("Message"),
            InputGroupAddon(h, { align: "block-end" }).children(
              InputGroupButton(h).children("Send"),
            ),
          );
      if (example === "Sizes")
        return h.div.class("grid gap-3").children(
          (["xs", "sm", "default", "md", "lg"] as const).map((size) =>
            InputGroup(h, { size })
              .class("w-72")
              .children(
                InputGroupInput(h, {
                  props: { value: model.value, disabled },
                  onUpdate: Message.Changed,
                }).attrs({
                  "aria-label": "Email",
                  placeholder: "you@example.com",
                  "aria-invalid": invalid ? "true" : undefined,
                }),
                InputGroupAddon(h).children(InputGroupText(h).children("@")),
                InputGroupAddon(h, { align: "inline-end" }).children(
                  InputGroupButton(h).children("Send"),
                ),
              ),
          ),
        );
      const size = "default";
      return InputGroup(h, { size })
        .class("w-72")
        .children(
          InputGroupInput(h, {
            props: { value: model.value, disabled },
            onUpdate: Message.Changed,
          }).attrs({
            "aria-label": "Email",
            placeholder: "you@example.com",
            "aria-invalid": invalid ? "true" : undefined,
          }),
          InputGroupAddon(h).children(InputGroupText(h).children("@")),
          InputGroupAddon(h, { align: "inline-end" }).children(
            InputGroupButton(h).children("Send"),
          ),
        );
    },
  });
