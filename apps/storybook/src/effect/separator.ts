import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { Separator } from "@omnisuite/ui/effect/components/separator";

export const separatorDemo = (example: "Horizontal" | "Vertical") =>
  Html.component({ name: "SeparatorDemo", model: Schema.Struct({}), message: Schema.Never }).make({
    init: () => ({}),
    update: ($) => $.model,
    view: (h) => {
      switch (example) {
        case "Horizontal":
          return h.div.class("grid w-64 gap-4").children("Collections", Separator(h), "Workspace");
        case "Vertical":
          return h.div
            .class("flex h-8 items-center gap-4")
            .children(
              "Collections",
              Separator(h, { props: { orientation: "vertical" } }),
              "Workspace",
            );
      }
    },
  });
