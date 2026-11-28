import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@omnisuite/ui/effect/components/card";
import { Button } from "@omnisuite/ui/effect/components/button";

export const cardDemo = (example: "Default" | "Small") =>
  Html.component({ name: "CardDemo", model: Schema.Struct({}), message: Schema.Never }).make({
    init: () => ({}),
    update: ($) => $.model,
    view: (h) => {
      switch (example) {
        case "Default":
          return Card(h, { size: "default" })
            .class("w-80")
            .children(
              CardHeader(h).children(
                CardTitle(h).children("Design system"),
                CardDescription(h).children("Shared components for your workspace."),
                CardAction(h).children(
                  Button(h, { variant: "ghost", size: "icon-sm" })
                    .attr("aria-label", "More")
                    .children("…"),
                ),
              ),
              CardContent(h).children("24 components ready to use."),
              CardFooter(h).children(Button(h).children("View collection")),
            );
        case "Small":
          return Card(h, { size: "sm" })
            .class("w-80")
            .children(
              CardHeader(h).children(
                CardTitle(h).children("Design system"),
                CardDescription(h).children("Shared components for your workspace."),
                CardAction(h).children(
                  Button(h, { variant: "ghost", size: "icon-sm" })
                    .attr("aria-label", "More")
                    .children("…"),
                ),
              ),
              CardContent(h).children("24 components ready to use."),
              CardFooter(h).children(Button(h).children("View collection")),
            );
      }
    },
  });
