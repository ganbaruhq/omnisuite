import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { Select } from "@omnisuite/ui/effect/components/select";
const items = [
  { value: "design", label: "Design" },
  { value: "engineering", label: "Engineering" },
  { value: "archived", label: "Archived", disabled: true },
];
const Message = UiSchema.TaggedEnum({
  Picked: { value: Schema.String },
  SetOpen: { open: Schema.Boolean, size: Schema.String },
});
export const selectDemo = (
  example: "Default" | "Placeholder" | "Open" | "Disabled" | "Invalid" | "Sizes",
) =>
  Html.component({
    name: "SelectDemo",
    model: Schema.Struct({
      value: Schema.NullOr(Schema.String),
      open: Schema.NullOr(Schema.String),
    }),
    message: Message,
  }).make({
    init: () => ({
      value: example === "Placeholder" ? null : "design",
      open: example === "Open" ? "default" : null,
    }),
    update: {
      Picked: ($, { value }) => $.evolve({ value }),
      SetOpen: ($, { open, size }) => $.evolve({ open: open ? size : null }),
    },
    view: (h, model) => {
      const draw = (size: "xs" | "sm" | "default" | "md" | "lg") =>
        Select(h, {
          key: size,
          props: {
            value: model.value,
            open: model.open === size,
            placeholder: "Choose an owner",
            items,
            disabled: example === "Disabled",
          },
          onEmit: {
            Picked: ({ value }) =>
              typeof value === "string" ? Message.Picked({ value }) : undefined,
            RequestedOpen: () => Message.SetOpen({ open: true, size }),
            RequestedClose: () => Message.SetOpen({ open: false, size }),
            Settled: () => undefined,
          },
          view: (select) =>
            h.div.class("w-64").children(
              select.control(h, {
                size,
                element: h.button
                  .attr("aria-label", example === "Sizes" ? size : "Owner")
                  .attr("aria-invalid", example === "Invalid" ? "true" : undefined),
              }),
              select.content(
                h,
                items.map((item) => select.option(h, item)),
              ),
            ),
        });
      return example === "Sizes"
        ? h.div
            .class("grid gap-3")
            .children((["xs", "sm", "default", "md", "lg"] as const).map(draw))
        : draw("default");
    },
  });
