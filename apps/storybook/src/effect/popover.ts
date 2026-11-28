import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { Popover } from "@omnisuite/ui/effect/components/popover";
import { Button } from "@omnisuite/ui/effect/components/button";

const Message = UiSchema.TaggedEnum({ SetOpen: { open: Schema.Boolean } });
export const popoverDemo = (example: "Default" | "Open" | "Top" | "Right" | "Bottom" | "Left") =>
  Html.component({
    name: "PopoverDemo",
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
              : "bottom";
      return Popover(h, {
        props: { open: model.open, side },
        onEmit: {
          RequestedOpen: () => Message.SetOpen({ open: true }),
          RequestedClose: () => Message.SetOpen({ open: false }),
          Settled: () => undefined,
        },
        view: (parts) =>
          h.div
            .class("p-24")
            .children(
              parts
                .trigger({ element: Button(h, { variant: "outline" }) })
                .children("About filters"),
              parts.content(h, [
                parts
                  .header(h.div)
                  .children(
                    parts.title(h.h2).children("About filters"),
                    parts.description(h.p).children("Filters only change what this list shows."),
                  ),
              ]),
            ),
      });
    },
  });
