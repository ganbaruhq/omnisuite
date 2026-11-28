import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@omnisuite/ui/effect/components/empty";
import { Button } from "@omnisuite/ui/effect/components/button";

export const emptyDemo = (example: "Default" | "Icon" | "WithoutAction") =>
  Html.component({ name: "EmptyDemo", model: Schema.Struct({}), message: Schema.Never }).make({
    init: () => ({}),
    update: ($) => $.model,
    view: (h) => {
      switch (example) {
        case "Default":
          return Empty(h).children(
            EmptyHeader(h).children(
              EmptyTitle(h).children("No collections yet"),
              EmptyDescription(h).children("Create a collection to organize your data."),
            ),
            EmptyContent(h).children(Button(h).children("New collection")),
          );
        case "Icon":
          return Empty(h).children(
            EmptyHeader(h).children(
              EmptyMedia(h, { variant: "icon" }).children("+"),
              EmptyTitle(h).children("No collections yet"),
              EmptyDescription(h).children("Create a collection to organize your data."),
            ),
            EmptyContent(h).children(Button(h).children("New collection")),
          );
        case "WithoutAction":
          return Empty(h).children(
            EmptyHeader(h).children(
              EmptyTitle(h).children("No collections yet"),
              EmptyDescription(h).children("Create a collection to organize your data."),
            ),
            null,
          );
      }
    },
  });
