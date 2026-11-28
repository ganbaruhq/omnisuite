import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { Toolbar } from "@omnisuite/ui/effect/components/toolbar";

export const toolbarDemo = (example: "Default" | "Disabled") =>
  Html.component({ name: "ToolbarDemo", model: Schema.Struct({}), message: Schema.Never }).make({
    init: () => ({}),
    update: ($) => $.model,
    view: (h) => {
      const disabled = example === "Disabled";
      return Toolbar(h, {
        props: {
          items: [
            { value: "refresh", disabled },
            { value: "archive", disabled: true },
          ],
        },
        view: (toolbar) =>
          toolbar
            .root(h.div)
            .attr("aria-label", "Collection actions")
            .children(
              toolbar.button({ element: h.button, value: "refresh" }).children("Refresh"),
              toolbar.button({ element: h.button, value: "archive" }).children("Archive"),
            ),
      });
    },
  });
