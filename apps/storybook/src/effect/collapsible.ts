import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { Collapsible } from "@omnisuite/ui/effect/components/collapsible";
import { Button } from "@omnisuite/ui/effect/components/button";

const Message = UiSchema.TaggedEnum({ SetOpen: { open: Schema.Boolean } });
export const collapsibleDemo = (example: "Default" | "Open" | "Disabled") =>
  Html.component({
    name: "CollapsibleDemo",
    model: Schema.Struct({ open: Schema.Boolean }),
    message: Message,
  }).make({
    init: () => ({ open: example === "Open" }),
    update: { SetOpen: ($, { open }) => $.evolve({ open }) },
    view: (h, model) => {
      return Collapsible(h, {
        props: { open: model.open, disabled: example === "Disabled" },
        onEmit: { Toggled: Message.SetOpen, Settled: () => undefined },
        view: (parts) =>
          parts
            .root(h.div)
            .class("grid w-72 gap-3")
            .children(
              parts.trigger(Button(h, { variant: "outline" })).children("Collection details"),
              parts
                .panel(h.div)
                ?.children(
                  h.p
                    .class("rounded-lg border p-4 text-sm")
                    .children("24 components ready to use."),
                ),
            ),
      });
    },
  });
