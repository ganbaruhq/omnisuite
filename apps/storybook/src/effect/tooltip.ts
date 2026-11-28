import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { Tooltip } from "@omnisuite/ui/effect/components/tooltip";
import { Button } from "@omnisuite/ui/effect/components/button";

const Message = UiSchema.TaggedEnum({ SetOpen: { open: Schema.Boolean } });
export const tooltipDemo = (example: "Default" | "Open" | "Top" | "Right" | "Bottom" | "Left") =>
  Html.component({
    name: "TooltipDemo",
    model: Schema.Struct({ open: Schema.Boolean }),
    message: Message,
  }).make({
    init: () => ({ open: example !== "Default" }),
    update: { SetOpen: ($, { open }) => $.evolve({ open }) },
    view: (h, model) => {
      const side =
        example === "Top"
          ? "top"
          : example === "Right"
            ? "right"
            : example === "Left"
              ? "left"
              : example === "Bottom"
                ? "bottom"
                : "top";
      return Tooltip(h, {
        props: { open: model.open, side },
        onEmit: {
          RequestedOpen: () => Message.SetOpen({ open: true }),
          RequestedClose: () => Message.SetOpen({ open: false }),
        },
        view: (parts) =>
          h.div
            .class("p-24")
            .children(
              parts.trigger(Button(h, { variant: "outline" })).children("Save"),
              parts.content(h, ["Saves the draft"]),
            ),
      });
    },
  });
