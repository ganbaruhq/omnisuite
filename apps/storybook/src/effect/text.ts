import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { Text } from "@omnisuite/ui/effect/components/text";

export const textDemo = (example: "Scale" | "Variants" | "Sizes" | "Truncated") =>
  Html.component({ name: "TextDemo", model: Schema.Struct({}), message: Schema.Never }).make({
    init: () => ({}),
    update: ($) => $.model,
    view: (h) => {
      switch (example) {
        case "Scale":
          return h.div
            .class("flex flex-col gap-4")
            .children(
              Text(h, { as: "h1", variant: "heading", size: "lg" }).children("Page heading"),
              Text(h, { as: "h2", variant: "heading" }).children("Section heading"),
              Text(h).children("Body copy for your interface."),
              Text(h, { variant: "secondary" }).children("Secondary copy and descriptions."),
              Text(h, { variant: "mono" }).children("collection_id"),
            );
        case "Variants":
          return h.div
            .class("grid gap-3")
            .children(
              (
                [
                  "body",
                  "secondary",
                  "success",
                  "error",
                  "heading",
                  "mono",
                  "mono-secondary",
                ] as const
              ).map((variant) => Text(h, { variant }).children(variant)),
            );
        case "Sizes":
          return h.div
            .class("grid gap-3")
            .children(
              (["xs", "sm", "base", "lg"] as const).map((size) =>
                Text(h, { size }).children(`Body copy ${size}`),
              ),
            );
        case "Truncated":
          return h.div
            .class("w-48")
            .children(
              Text(h, { truncate: true }).children(
                "A long collection title that truncates within its container",
              ),
            );
      }
    },
  });
