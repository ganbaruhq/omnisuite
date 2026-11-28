import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import {
  ButtonGroup,
  ButtonGroupText,
  ButtonGroupSeparator,
} from "@omnisuite/ui/effect/components/button-group";
import { Button } from "@omnisuite/ui/effect/components/button";

export const button_groupDemo = (example: "Default" | "Vertical" | "WithSeparator") =>
  Html.component({ name: "ButtonGroupDemo", model: Schema.Struct({}), message: Schema.Never }).make(
    {
      init: () => ({}),
      update: ($) => $.model,
      view: (h) => {
        switch (example) {
          case "Default":
            return ButtonGroup(h)
              .attr("aria-label", "Page actions")
              .children(
                ButtonGroup(h).children(
                  Button(h, { variant: "outline" }).children("Documentation"),
                ),
                ButtonGroup(h).children(Button(h).children("Create collection")),
              );
          case "Vertical":
            return ButtonGroup(h, { orientation: "vertical" })
              .attr("aria-label", "Page actions")
              .children(
                Button(h, { variant: "outline" }).children("Documentation"),
                Button(h, { variant: "outline" }).children("Create collection"),
              );
          case "WithSeparator":
            return ButtonGroup(h)
              .attr("aria-label", "Zoom")
              .children(
                ButtonGroupText(h).children("100%"),
                ButtonGroupSeparator(h),
                Button(h, { variant: "outline" }).children("Zoom in"),
              );
        }
      },
    },
  );
