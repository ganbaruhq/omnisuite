import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import {
  Badge,
  BadgeDot,
  BadgeImage,
  BadgeWithButton,
  type BadgeVariant,
} from "@omnisuite/ui/effect/components/badge";
import { AVATAR_IMAGE, FLAG_IMAGE } from "../story-data";

const Message = UiSchema.TaggedEnum({
  Dismiss: { id: Schema.String },
  Reset: { id: Schema.String },
});
const sizes = ["sm", "md", "lg"] as const;
const colors = [
  "gray",
  "brand",
  "error",
  "warning",
  "success",
  "slate",
  "sky",
  "blue",
  "indigo",
  "purple",
  "pink",
  "orange",
] as const;
const rows = [
  "Label",
  "With dot",
  "With flag",
  "With avatar",
  "With close X",
  "With icon leading",
  "With icon trailing",
  "With icon only",
];
export const badgeDemo = (example: "Default" | "Example" | "Pill" | "Rectangle" | "Modern") =>
  Html.component({
    name: "BadgeDemo",
    model: Schema.Struct({ hidden: Schema.Array(Schema.String) }),
    message: Message,
  }).make({
    init: () => ({ hidden: [] }),
    update: {
      Dismiss: ($, { id }) => $.evolve({ hidden: (ids) => [...ids, id] }),
      Reset: ($, { id }) => $.evolve({ hidden: (ids) => ids.filter((value) => value !== id) }),
    },
    view: (h, model) => {
      if (example === "Default")
        return Badge(h, { variant: "pill-color", color: "brand", size: "md" }).children("Label");
      if (example === "Example")
        return h.div
          .class("flex items-center gap-3")
          .children(
            (["pill-color", "color", "modern"] as const).map((variant) =>
              Badge(h, { variant, color: "brand" }).children(BadgeDot(h), "Label"),
            ),
          );
      const variant: BadgeVariant =
        example === "Pill" ? "pill-color" : example === "Rectangle" ? "color" : "modern";
      const icon = (direction: "up" | "right" | "plus") =>
        h.svg
          .attrs({
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            "stroke-width": "2",
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "aria-hidden": "true",
          })
          .children(
            (direction === "up"
              ? ["M12 5v14", "M5 12l7 -7l7 7"]
              : direction === "right"
                ? ["M5 12h14", "M12 5l7 7l-7 7"]
                : ["M12 5v14", "M5 12h14"]
            ).map((d) => h.path.attr("d", d)),
          );
      return h.div.class("flex flex-col gap-8").children(
        h.div.class("grid grid-cols-[auto_repeat(3,auto)] items-center gap-x-8 gap-y-4").children(
          h.span,
          sizes.map((size) => h.span.class("text-xs text-muted-foreground").children(size)),
          rows.map((row) =>
            h.div.class("contents").children(
              h.span.class("text-xs text-muted-foreground").children(row),
              sizes.map((size) => {
                const options = { variant, color: "brand", size } as const;
                const id = `${variant}-${size}`;
                if (row === "With close X")
                  return h.div.children(
                    model.hidden.includes(id)
                      ? h.button
                          .attr("type", "button")
                          .class("text-xs underline")
                          .on("click", Message.Reset({ id }))
                          .children("Reset")
                      : BadgeWithButton(h, {
                          ...options,
                          buttonLabel: "Clear",
                          onPress: Message.Dismiss({ id }),
                          children: ["Label"],
                        }),
                  );
                return h.div.children(
                  row === "With flag"
                    ? Badge(h, options).children(
                        BadgeImage(h).attrs({ src: FLAG_IMAGE, alt: "" }),
                        "Australia",
                      )
                    : row === "With avatar"
                      ? Badge(h, options).children(
                          BadgeImage(h).attrs({ src: AVATAR_IMAGE, alt: "" }),
                          "Olivia",
                        )
                      : row === "With dot"
                        ? Badge(h, options).children(BadgeDot(h), "Label")
                        : row === "With icon leading"
                          ? Badge(h, options).children(
                              icon("up").attr("data-icon", "inline-start"),
                              "Label",
                            )
                          : row === "With icon trailing"
                            ? Badge(h, options).children(
                                "Label",
                                icon("right").attr("data-icon", "inline-end"),
                              )
                            : row === "With icon only"
                              ? Badge(h, options)
                                  .attrs({ role: "img", "aria-label": "Add" })
                                  .children(icon("plus").attr("data-icon", "only"))
                              : Badge(h, options).children("Label"),
                );
              }),
            ),
          ),
        ),
        h.div
          .class("flex max-w-3xl flex-wrap gap-2")
          .children(
            colors.map((color) => Badge(h, { variant, color }).children(BadgeDot(h), color)),
          ),
      );
    },
  });
