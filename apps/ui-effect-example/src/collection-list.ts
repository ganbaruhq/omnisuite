import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { Button } from "@omnisuite/ui/effect/components/button";
import { Checkbox } from "@omnisuite/ui/effect/components/checkbox";
import { DropdownMenu } from "@omnisuite/ui/effect/components/dropdown-menu";
import { Popover } from "@omnisuite/ui/effect/components/popover";
import { Sheet } from "@omnisuite/ui/effect/components/sheet";
import { Icon } from "@omnisuite/ui/effect/lib/icons";

// ---------------------------------------------------------------------------
// The list: collections with an action menu on each row, and a filter sheet
// ---------------------------------------------------------------------------

const Collection = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  pages: Schema.Number,
  updated: Schema.Number,
  pinned: Schema.Boolean,
  // A locked collection can't be deleted.
  locked: Schema.Boolean,
});
type Collection = typeof Collection.Type;

const Sort = Schema.Literals(["name", "updated"]);
type Sort = typeof Sort.Type;

const sorts = [
  { value: "name", label: "Name" },
  { value: "updated", label: "Last updated" },
] as const;

const Message = UiSchema.TaggedEnum({
  SetRowMenu: { id: Schema.NullOr(Schema.String) },
  PickedRowAction: {
    id: Schema.String,
    value: Schema.String,
    checked: Schema.optional(Schema.Boolean),
  },
  SetFiltersOpen: { open: Schema.Boolean },
  SetSortMenuOpen: { open: Schema.Boolean },
  SetHelpOpen: { open: Schema.Boolean },
  PickedSort: { sort: Sort },
  ToggledPinnedOnly: { checked: Schema.Boolean },
});

const ignored = {
  Highlighted: () => undefined,
  RequestedQuery: () => undefined,
  Settled: () => undefined,
};

const seed: ReadonlyArray<Collection> = [
  { id: "design", name: "Design system", pages: 24, updated: 3, pinned: true, locked: true },
  { id: "research", name: "Research notes", pages: 9, updated: 5, pinned: false, locked: false },
  { id: "launch", name: "Launch plan", pages: 13, updated: 1, pinned: false, locked: false },
];

const sorted = (rows: ReadonlyArray<Collection>, sort: Sort) =>
  [...rows].sort((a, b) =>
    sort === "name" ? a.name.localeCompare(b.name) : b.updated - a.updated,
  );

const sortLabel = (sort: Sort) => sorts.find((option) => option.value === sort)!.label;

export const CollectionList = Html.component({
  name: "CollectionList",
  model: Schema.Struct({
    rows: Schema.Array(Collection),
    rowMenu: Schema.NullOr(Schema.String),
    filtersOpen: Schema.Boolean,
    sortMenuOpen: Schema.Boolean,
    helpOpen: Schema.Boolean,
    sort: Sort,
    pinnedOnly: Schema.Boolean,
    status: Schema.String,
    copies: Schema.Number,
  }),
  message: Message,
}).make({
  init: () => ({
    rows: seed,
    rowMenu: null,
    filtersOpen: false,
    sortMenuOpen: false,
    helpOpen: false,
    sort: "name",
    pinnedOnly: false,
    status: "",
    copies: 0,
  }),
  update: {
    SetRowMenu: ($, { id }) => $.evolve({ rowMenu: () => id }),
    PickedRowAction: ($, { id, value, checked }) => {
      const row = $.model.rows.find((collection) => collection.id === id);
      if (row === undefined) return $.model;
      switch (value) {
        case "rename":
          return $.evolve({ status: () => `Renaming “${row.name}”.` });
        case "duplicate": {
          const copies = $.model.copies + 1;
          const copy = { ...row, id: `${row.id}-copy-${copies}`, name: `${row.name} copy` };
          return $.evolve({
            copies: () => copies,
            rows: (rows) => [...rows, { ...copy, pinned: false, locked: false }],
            status: () => `Duplicated “${row.name}”.`,
          });
        }
        case "pinned":
          return $.evolve({
            rows: (rows) =>
              rows.map((collection) =>
                collection.id === id ? { ...collection, pinned: checked === true } : collection,
              ),
            status: () => `${checked === true ? "Pinned" : "Unpinned"} “${row.name}”.`,
          });
        case "delete":
          return $.evolve({
            rows: (rows) => rows.filter((collection) => collection.id !== id),
            status: () => `Deleted “${row.name}”.`,
          });
        default:
          return $.model;
      }
    },
    // The menus and the help popover inside the sheet close with it.
    SetFiltersOpen: ($, { open }) =>
      $.evolve({
        filtersOpen: () => open,
        sortMenuOpen: (sortMenuOpen) => open && sortMenuOpen,
        helpOpen: (helpOpen) => open && helpOpen,
      }),
    SetSortMenuOpen: ($, { open }) => $.evolve({ sortMenuOpen: () => open }),
    SetHelpOpen: ($, { open }) => $.evolve({ helpOpen: () => open }),
    PickedSort: ($, { sort }) => $.evolve({ sort: () => sort }),
    ToggledPinnedOnly: ($, { checked }) => $.evolve({ pinnedOnly: () => checked }),
  },
  view: (h, model) => {
    const visible = sorted(
      model.rows.filter((row) => !model.pinnedOnly || row.pinned),
      model.sort,
    );

    const rowMenu = (row: Collection) =>
      DropdownMenu(h, {
        key: `row-${row.id}`,
        props: {
          open: model.rowMenu === row.id,
          items: [
            { value: "rename", label: "Rename" },
            { value: "duplicate", label: "Duplicate" },
            { value: "pinned", label: "Pinned", checked: row.pinned },
            { value: "delete", label: "Delete", disabled: row.locked },
          ],
        },
        onEmit: {
          ...ignored,
          RequestedOpen: () => Message.SetRowMenu({ id: row.id }),
          RequestedClose: () => Message.SetRowMenu({ id: null }),
          Picked: ({ value, checked }) =>
            Message.PickedRowAction(
              checked === undefined ? { id: row.id, value } : { id: row.id, value, checked },
            ),
        },
        view: (menu) =>
          h.div(
            menu
              .trigger({ element: Button(h, { variant: "ghost", size: "icon-sm" }) })
              .attr("aria-label", `Actions for ${row.name}`)
              .children(Icon(h, "dots")),
            menu.content(h, [
              menu.item({ element: h.div, value: "rename" }).children("Rename"),
              menu.item({ element: h.div, value: "duplicate" }).children("Duplicate"),
              menu.checkboxOption(h, { value: "pinned", label: "Pinned" }),
              menu.separator(h.div),
              menu
                .item({ element: h.div, value: "delete", variant: "destructive" })
                .children("Delete"),
            ]),
          ),
      });

    const sortMenu = DropdownMenu(h, {
      key: "sort",
      props: {
        open: model.sortMenuOpen,
        items: sorts.map((option) => ({ ...option, checked: model.sort === option.value })),
      },
      onEmit: {
        ...ignored,
        RequestedOpen: () => Message.SetSortMenuOpen({ open: true }),
        RequestedClose: () => Message.SetSortMenuOpen({ open: false }),
        Picked: ({ value }) =>
          Schema.is(Sort)(value) ? Message.PickedSort({ sort: value }) : undefined,
      },
      view: (menu) =>
        h.div(
          menu
            .trigger({ element: Button(h, { variant: "outline" }) })
            .class("w-full justify-between")
            .children(`Sort by: ${sortLabel(model.sort)}`, Icon(h, "chevron-down")),
          menu.content(h, [
            menu.radioGroup(h.div).children(sorts.map((option) => menu.radioOption(h, option))),
          ]),
        ),
    });

    const help = Popover(h, {
      props: { open: model.helpOpen },
      onEmit: {
        RequestedOpen: () => Message.SetHelpOpen({ open: true }),
        RequestedClose: () => Message.SetHelpOpen({ open: false }),
        Settled: () => undefined,
      },
      view: (popover) =>
        h.div(
          popover
            .trigger({ element: Button(h, { variant: "link", size: "sm" }) })
            .class("px-0")
            .children("How do filters work?"),
          popover.content(h, [
            popover
              .header(h.div)
              .children(
                popover.title(h.h3).children("About filters"),
                popover
                  .description(h.p)
                  .children("Filters only change what this list shows, not the collections."),
              ),
            popover.close(Button(h, { variant: "outline", size: "sm" })).children("Got it"),
          ]),
        ),
    });

    const pinnedOnly = h.div.class("flex items-center gap-2").children(
      Checkbox(h, {
        props: { checked: model.pinnedOnly },
        onEmit: { Toggled: ({ checked }) => Message.ToggledPinnedOnly({ checked }) },
        view: (checkbox) => checkbox.box(h, h.button.attr("id", "pinned-only")),
      }),
      h.label.attr("for", "pinned-only").class("text-sm").children("Pinned only"),
    );

    const filters = Sheet(h, {
      props: { open: model.filtersOpen },
      onEmit: {
        RequestedOpen: () => Message.SetFiltersOpen({ open: true }),
        RequestedClose: () => Message.SetFiltersOpen({ open: false }),
        Snapped: () => undefined,
        Settled: () => undefined,
      },
      view: (sheet) =>
        h.div(
          sheet.trigger(Button(h, { variant: "outline" })).children(Icon(h, "filter"), "Filters"),
          sheet.content(h, [
            sheet
              .header(h.div)
              .children(
                sheet.title(h.h2).children("Filters"),
                sheet.description(h.p).children("Choose which collections the list shows."),
              ),
            h.div.class("flex flex-col gap-4 px-6").children(sortMenu, pinnedOnly, help),
            sheet
              .footer(h.div)
              .children(sheet.close(Button(h, { variant: "outline" })).children("Done")),
          ]),
        ),
    });

    return h.section.class("mx-auto flex w-full max-w-2xl flex-col gap-4 px-10 pb-10").children(
      h.div
        .class("flex items-center justify-between gap-3")
        .children(h.h2.class("text-lg font-semibold").children("Your collections"), filters),
      h.ul
        .attr("aria-label", "Your collections")
        .class("flex flex-col divide-y rounded-lg border")
        .children(
          visible.map((row) =>
            h.li
              .attr("data-row", row.id)
              .class("flex items-center justify-between gap-3 px-4 py-3")
              .children(
                h.div
                  .class("flex flex-col")
                  .children(
                    h.span
                      .class("text-sm font-medium")
                      .children(
                        row.name,
                        row.pinned
                          ? h.span.class("ml-2 text-xs text-muted-foreground").children("Pinned")
                          : null,
                      ),
                    h.span
                      .class("text-xs text-muted-foreground")
                      .children(`${row.pages} pages${row.locked ? " · Locked" : ""}`),
                  ),
                rowMenu(row),
              ),
          ),
        ),
      h.p.attr("role", "status").class("text-sm text-muted-foreground").children(model.status),
    );
  },
});
