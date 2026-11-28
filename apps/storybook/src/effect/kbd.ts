import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { Kbd, KbdGroup } from "@omnisuite/ui/effect/components/kbd";

export const kbdDemo = (example: "Default" | "Shortcut") =>
  Html.component({ name: "KbdDemo", model: Schema.Struct({}), message: Schema.Never }).make({
    init: () => ({}),
    update: ($) => $.model,
    view: (h) => {
      switch (example) {
        case "Default":
          return Kbd(h).children("⌘");
        case "Shortcut":
          return KbdGroup(h).children(Kbd(h).children("⌘"), "+", Kbd(h).children("K"));
      }
    },
  });
