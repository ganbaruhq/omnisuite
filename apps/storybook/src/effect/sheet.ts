import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { Sheet } from "@omnisuite/ui/effect/components/sheet";
import { Button } from "@omnisuite/ui/effect/components/button";

const Message = UiSchema.TaggedEnum({ SetOpen: { open: Schema.Boolean } });
export const sheetDemo = (example: "Default" | "Open" | "Disabled" | "Top" | "Bottom" | "Left") =>
  Html.component({
    name: "SheetDemo",
    model: Schema.Struct({ open: Schema.Boolean }),
    message: Message,
  }).make({
    init: () => ({ open: example !== "Default" && example !== "Disabled" }),
    update: { SetOpen: ($, { open }) => $.evolve({ open }) },
    view: (h, model) => {
      return Sheet(h, {
        props: {
          open: model.open,
          swipeDirection:
            example === "Top"
              ? "up"
              : example === "Bottom"
                ? "down"
                : example === "Left"
                  ? "left"
                  : "right",
        },
        onEmit: {
          RequestedOpen: () => Message.SetOpen({ open: true }),
          RequestedClose: () => Message.SetOpen({ open: false }),
          Settled: () => undefined,
          Snapped: () => undefined,
        },
        view: (parts) =>
          h.div
            .class("p-10")
            .children(
              parts
                .trigger(
                  Button(h, { variant: "outline", props: { disabled: example === "Disabled" } }),
                )
                .children("Open sheet"),
              parts.content(h, [
                parts
                  .header(h.div)
                  .children(
                    parts.title(h.h2).children("Collection details"),
                    parts.description(h.p).children("Additional information for this collection."),
                  ),
                parts
                  .footer(h.div)
                  .children(parts.close(Button(h, { variant: "outline" })).children("Close")),
              ]),
            ),
      });
    },
  });
