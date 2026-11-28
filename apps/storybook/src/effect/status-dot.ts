import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { StatusDot } from "@omnisuite/ui/effect/components/status-dot";

export const status_dotDemo = (example: "Statuses" | "Pulse") =>
  Html.component({ name: "StatusDotDemo", model: Schema.Struct({}), message: Schema.Never }).make({
    init: () => ({}),
    update: ($) => $.model,
    view: (h) => {
      switch (example) {
        case "Statuses":
          return h.div
            .class("flex items-center gap-4")
            .children(
              (["success", "warning", "destructive", "info", "neutral"] as const).map((status) =>
                h.span
                  .class("flex items-center gap-2 text-sm")
                  .children(StatusDot(h, { status, pulse: false, label: status }), status),
              ),
            );
        case "Pulse":
          return h.div
            .class("flex items-center gap-4")
            .children(
              (["success", "warning", "destructive", "info", "neutral"] as const).map((status) =>
                h.span
                  .class("flex items-center gap-2 text-sm")
                  .children(StatusDot(h, { status, pulse: true, label: status }), status),
              ),
            );
      }
    },
  });
