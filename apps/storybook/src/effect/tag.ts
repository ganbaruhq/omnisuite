import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import {
  Tag,
  TagGroup,
  TagContent,
  TagCount,
  type TagSize,
} from "@omnisuite/ui/effect/components/tag";
import { StatusDot } from "@omnisuite/ui/effect/components/status-dot";
import { Avatar } from "@omnisuite/ui/effect/components/avatar";
import { Icon } from "@omnisuite/ui/effect/lib/icons";
import {
  tagToggleClasses,
  tagRemoveClasses,
  tagCheckboxClasses,
  tagAvatarClasses,
} from "@omnisuite/ui/lib/recipes/tag";
import { AVATAR_IMAGE } from "../story-data";

const Message = UiSchema.TaggedEnum({
  Select: { id: Schema.String },
  Remove: { id: Schema.String },
  Reset: {},
});
const initial = [
  { id: "design", label: "Design", count: 12 },
  { id: "engineering", label: "Engineering", count: 48 },
  { id: "marketing", label: "Marketing", count: 7 },
  { id: "finance", label: "Finance", count: 3 },
];
export const tagDemo = (
  example:
    | "Default"
    | "Sizes"
    | "Removable"
    | "Selectable"
    | "SingleSelect"
    | "SelectableRemovable",
) =>
  Html.component({
    name: "TagDemo",
    model: Schema.Struct({
      ids: Schema.Array(Schema.String),
      selected: Schema.Array(Schema.String),
    }),
    message: Message,
  }).make({
    init: () => ({
      ids: initial.map((item) => item.id),
      selected: [
        example === "SingleSelect" ? "recent" : example === "Selectable" ? "active" : "design",
      ],
    }),
    update: {
      Select: ($, { id }) =>
        $.evolve({
          selected: (ids) =>
            example === "SingleSelect"
              ? [id]
              : ids.includes(id)
                ? ids.filter((value) => value !== id)
                : [...ids, id],
        }),
      Remove: ($, { id }) => $.evolve({ ids: (ids) => ids.filter((value) => value !== id) }),
      Reset: ($) => $.evolve({ ids: initial.map((item) => item.id) }),
    },
    view: (h, model) => {
      if (example === "Default") return Tag(h).children("Label");
      if (example === "Sizes")
        return h.div.class("flex flex-col gap-4").children(
          (["sm", "md", "lg"] as const).map((size) =>
            TagGroup(h)
              .attr("aria-label", `Tags ${size}`)
              .children(
                Tag(h, { size }).children(TagContent(h, { size }).children("Label")),
                Tag(h, { size }).children(
                  TagContent(h, { size }).children(StatusDot(h, { status: "success" }), "Active"),
                ),
                Tag(h, { size }).children(
                  TagContent(h, { size }).children(
                    Avatar(h, {
                      key: size,
                      props: { src: AVATAR_IMAGE },
                      view: (avatar) =>
                        avatar
                          .root(h.span)
                          .class(...tagAvatarClasses)
                          .children(
                            avatar.image(h.img.attr("alt", "")),
                            avatar.fallback(h.span)?.children("OR"),
                          ),
                    }),
                    "Olivia Rhye",
                  ),
                ),
                Tag(h, { size }).children(
                  TagContent(h, { size }).children("Design"),
                  TagCount(h, { size }).children("12"),
                ),
              ),
          ),
        );
      const removable = example === "Removable" || example === "SelectableRemovable";
      const selectable = example !== "Removable";
      // Tag is markup-only in Effect: selection and removal are explicit consumer controls.
      const itemView = (
        item: { id: string; label: string; count?: number; disabled?: boolean },
        size: TagSize,
      ) => {
        const selected = model.selected.includes(item.id);
        const content = TagContent(h, { size }).children(item.label);
        return Tag(h, { size, disabled: item.disabled ?? false })
          .attrs({
            "data-selectable": selectable ? "" : undefined,
            role: selectable ? undefined : "listitem",
          })
          .children(
            selectable
              ? h.button
                  .attrs({
                    type: "button",
                    "data-slot": "tag-toggle",
                    "aria-pressed": String(selected),
                    "data-pressed": selected ? "" : undefined,
                  })
                  .disabled(item.disabled ?? false)
                  .class(...tagToggleClasses)
                  .on("click", Message.Select({ id: item.id }))
                  .children(
                    h.span
                      .class(
                        ...tagCheckboxClasses,
                        size === "sm" ? "size-3.5" : size === "lg" ? "size-4.5" : "size-4",
                      )
                      .children(selected ? Icon(h, "check").class("size-3") : null),
                    content,
                  )
              : content,
            item.count === undefined ? null : TagCount(h, { size }).children(String(item.count)),
            removable
              ? h.button
                  .attrs({
                    type: "button",
                    "data-slot": "tag-remove",
                    "aria-label": `Remove ${item.label}`,
                  })
                  .class(...tagRemoveClasses, "p-0.5")
                  .on("click", Message.Remove({ id: item.id }))
                  .children(Icon(h, "x").class("size-3"))
              : null,
          );
      };
      if (example === "SingleSelect")
        return TagGroup(h)
          .attr("aria-label", "Sort")
          .attr("role", "group")
          .children(
            [
              { id: "recent", label: "Recent" },
              { id: "name", label: "Name" },
              { id: "size", label: "Size" },
            ].map((item) => itemView(item, "sm")),
          );
      if (example === "Selectable")
        return h.div.class("flex flex-col gap-4").children(
          (["sm", "md", "lg"] as const).map((size) =>
            TagGroup(h)
              .attrs({ "aria-label": `Status ${size}`, role: "group" })
              .children(
                [
                  { id: "active", label: "Active" },
                  { id: "archived", label: "Archived" },
                  { id: "draft", label: "Draft", disabled: true },
                ].map((item) => itemView(item, size)),
              ),
          ),
        );
      return h.div.class("flex flex-col gap-3").children(
        TagGroup(h)
          .attrs({ "aria-label": "Teams", role: selectable ? "group" : "list" })
          .children(
            initial
              .filter((item) => model.ids.includes(item.id))
              .map((item) => itemView(item, "md")),
          ),
        h.button
          .attr("type", "button")
          .class("w-fit text-xs text-muted-foreground underline")
          .on("click", Message.Reset())
          .children("Reset example"),
      );
    },
  });
