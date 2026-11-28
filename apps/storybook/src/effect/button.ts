import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { Button } from "@omnisuite/ui/effect/components/button";
import { Icon } from "@omnisuite/ui/effect/lib/icons";

export const buttonDemo = (example: "Default" | "Variants" | "Sizes" | "Disabled" | "Pending") =>
  Html.component({ name: "ButtonDemo", model: Schema.Struct({}), message: Schema.Never }).make({
    init: () => ({}),
    update: ($) => $.model,
    view: (h) => {
      if (example === "Variants")
        return h.div
          .class("flex flex-wrap gap-3")
          .children(
            (["default", "outline", "secondary", "ghost", "destructive", "link"] as const).map(
              (variant) => Button(h, { variant }).children(variant),
            ),
          );
      if (example === "Sizes")
        return h.div.class("flex flex-wrap items-center gap-3").children(
          (
            ["xs", "sm", "default", "md", "lg", "icon-xs", "icon-sm", "icon", "icon-lg"] as const
          ).map((size) =>
            Button(h, { size })
              .attr("aria-label", size)
              .children(size.startsWith("icon") ? Icon(h, "check") : size),
          ),
        );
      // Effect has no status prop: the consumer owns busy semantics and the indicator.
      return Button(h, { props: { disabled: example === "Disabled" || example === "Pending" } })
        .attr("aria-busy", example === "Pending" ? "true" : undefined)
        .children(
          example === "Pending"
            ? Icon(h, "loader").class("animate-spin motion-reduce:animate-none")
            : null,
          example === "Pending" ? "Saving" : "Save changes",
        );
    },
  });
