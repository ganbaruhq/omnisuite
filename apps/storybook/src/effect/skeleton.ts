import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { Skeleton } from "@omnisuite/ui/effect/components/skeleton";

export const skeletonDemo = (example: "Default" | "Card") =>
  Html.component({ name: "SkeletonDemo", model: Schema.Struct({}), message: Schema.Never }).make({
    init: () => ({}),
    update: ($) => $.model,
    view: (h) => {
      switch (example) {
        case "Default":
          return Skeleton(h).class("h-4 w-64");
        case "Card":
          return h.div
            .class("flex items-center gap-4")
            .attr("aria-label", "Loading profile")
            .children(
              Skeleton(h).class("size-12 rounded-full"),
              h.div
                .class("grid gap-2")
                .children(Skeleton(h).class("h-4 w-48"), Skeleton(h).class("h-4 w-32")),
            );
      }
    },
  });
