import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { DropdownMenu } from "@omnisuite/ui/effect/components/dropdown-menu";
import { Button } from "@omnisuite/ui/effect/components/button";

const Message = UiSchema.TaggedEnum({
  SetOpen: { open: Schema.Boolean },
  SetSubmenu: { open: Schema.Boolean },
  Picked: { value: Schema.String, checked: Schema.Boolean },
});
export const dropdown_menuDemo = (example: "Default" | "Open" | "Choices" | "Nested") =>
  Html.component({
    name: "DropdownMenuDemo",
    model: Schema.Struct({
      open: Schema.Boolean,
      submenu: Schema.Boolean,
      pinned: Schema.Boolean,
      sort: Schema.String,
      action: Schema.String,
    }),
    message: Message,
  }).make({
    init: () => ({
      open: example !== "Default",
      submenu: false,
      pinned: true,
      sort: "name",
      action: "",
    }),
    update: {
      SetOpen: ($, { open }) => $.evolve({ open, submenu: false }),
      SetSubmenu: ($, { open }) => $.evolve({ submenu: open }),
      Picked: ($, { value, checked }) =>
        value === "pinned"
          ? $.evolve({ pinned: checked })
          : value === "name" || value === "updated"
            ? $.evolve({ sort: value })
            : $.evolve({ action: value }),
    },
    view: (h, model) => {
      return DropdownMenu(h, {
        props: {
          open: model.open,
          items: [
            { value: "rename", label: "Rename" },
            { value: "share", label: "Share" },
            { value: "duplicate", label: "Duplicate", disabled: true },
            { value: "delete", label: "Delete" },
            { value: "pinned", label: "Pinned", checked: model.pinned },
            { value: "name", label: "Name", checked: model.sort === "name" },
            { value: "updated", label: "Last updated", checked: model.sort === "updated" },
          ],
        },
        onEmit: {
          RequestedOpen: () => Message.SetOpen({ open: true }),
          RequestedClose: () => Message.SetOpen({ open: false }),
          Picked: ({ value, checked }) => Message.Picked({ value, checked: checked ?? false }),
          Highlighted: () => undefined,
          RequestedQuery: () => undefined,
          Settled: () => undefined,
        },
        view: (menu) =>
          h.div.class("p-10").children(
            menu.trigger({ element: Button(h, { variant: "outline" }) }).children("Actions"),
            menu.content(
              h,
              example === "Nested"
                ? [
                    DropdownMenu(h, {
                      key: "share",
                      props: {
                        open: model.submenu,
                        parentItem: "share",
                        items: [
                          { value: "email", label: "Email" },
                          { value: "link", label: "Copy link" },
                        ],
                      },
                      onEmit: {
                        RequestedOpen: () => Message.SetSubmenu({ open: true }),
                        RequestedClose: () => Message.SetSubmenu({ open: false }),
                        Picked: ({ value }) => Message.Picked({ value, checked: false }),
                        Highlighted: () => undefined,
                        RequestedQuery: () => undefined,
                        Settled: () => undefined,
                      },
                      view: (sub) =>
                        h.div.children(
                          menu.subTrigger(
                            h,
                            { element: sub.submenuTrigger(h.div), value: "share" },
                            ["Share"],
                          ),
                          sub.content(h, [
                            sub.item({ element: h.div, value: "email" }).children("Email"),
                            sub.item({ element: h.div, value: "link" }).children("Copy link"),
                          ]),
                        ),
                    }),
                  ]
                : example === "Choices"
                  ? [
                      menu.checkboxOption(h, { value: "pinned", label: "Pinned" }),
                      menu.separator(h.div),
                      menu
                        .radioGroup(h.div)
                        .children(
                          menu.radioOption(h, { value: "name", label: "Name" }),
                          menu.radioOption(h, { value: "updated", label: "Last updated" }),
                        ),
                    ]
                  : [
                      menu
                        .item({ element: h.div, value: "rename" })
                        .children("Rename", menu.shortcut(h.span).children("⌘R")),
                      menu.item({ element: h.div, value: "duplicate" }).children("Duplicate"),
                      menu.separator(h.div),
                      menu
                        .item({ element: h.div, value: "delete", variant: "destructive" })
                        .children("Delete"),
                    ],
            ),
            h.output.attr("aria-label", "Last action").children(model.action),
          ),
      });
    },
  });
