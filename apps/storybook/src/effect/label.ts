import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { Label } from "@omnisuite/ui/effect/components/label";
import { Input } from "@omnisuite/ui/effect/components/input";

export const labelDemo = (example: "Default" | "Disabled") =>
  Html.component({ name: "LabelDemo", model: Schema.Struct({}), message: Schema.Never }).make({
    init: () => ({}),
    update: ($) => $.model,
    view: (h) => {
      switch (example) {
        case "Default":
          return h.div.class("grid w-64 gap-2").children(
            Label(h).attr("for", "label-name").children("Collection name"),
            Input(h, { props: { value: "" } })
              .attr("id", "label-name")
              .attr("placeholder", "Design system"),
          );
        case "Disabled":
          return h.div
            .class("group grid w-64 gap-2")
            .attr("data-disabled", "true")
            .children(
              Label(h).attr("for", "label-name").children("Collection name"),
              Input(h, { props: { value: "", disabled: true } })
                .attr("id", "label-name")
                .attr("placeholder", "Design system"),
            );
      }
    },
  });
