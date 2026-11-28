import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { Dialog } from "@omnisuite/ui/effect/components/dialog";
import { Button } from "@omnisuite/ui/effect/components/button";

const Message = UiSchema.TaggedEnum({ SetOpen: { open: Schema.Boolean } });
export const dialogDemo = (example: "Default" | "Open" | "Disabled") =>
  Html.component({
    name: "DialogDemo",
    model: Schema.Struct({ open: Schema.Boolean }),
    message: Message,
  }).make({
    init: () => ({ open: example !== "Default" && example !== "Disabled" }),
    update: { SetOpen: ($, { open }) => $.evolve({ open }) },
    view: (h, model) => {
      return Dialog(h, {
        props: { open: model.open },
        onEmit: {
          RequestedOpen: () => Message.SetOpen({ open: true }),
          RequestedClose: () => Message.SetOpen({ open: false }),
          Settled: () => undefined,
        },
        view: (parts) =>
          h.div
            .class("p-10")
            .children(
              parts
                .trigger(
                  Button(h, { variant: "outline", props: { disabled: example === "Disabled" } }),
                )
                .children("Open dialog"),
              parts.content(
                h,
                [
                  parts
                    .header(h.div)
                    .children(
                      parts.title(h.h2).children("Confirm changes"),
                      parts.description(h.p).children("Review your changes before continuing."),
                    ),
                  parts
                    .footer(h.div)
                    .children(
                      parts.close(Button(h, { variant: "outline" })).children("Cancel"),
                      parts.close(Button(h)).children("Confirm"),
                    ),
                ],
                { showCloseButton: true },
              ),
            ),
      });
    },
  });
