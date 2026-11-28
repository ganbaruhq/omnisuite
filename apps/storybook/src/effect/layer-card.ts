import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import {
  LayerCard,
  LayerCardPrimary,
  LayerCardSecondary,
} from "@omnisuite/ui/effect/components/layer-card";

export const layer_cardDemo = (example: "Default") =>
  Html.component({ name: "LayerCardDemo", model: Schema.Struct({}), message: Schema.Never }).make({
    init: () => ({}),
    update: ($) => $.model,
    view: (h) => {
      switch (example) {
        case "Default":
          return LayerCard(h)
            .class("w-80")
            .children(
              LayerCardPrimary(h).children(
                h.h2.class("font-semibold").children("Design system"),
                h.p.children("24 shared components."),
              ),
              LayerCardSecondary(h).children("Updated today"),
            );
      }
    },
  });
