import { UiSchema } from "@effect/ui";
import { Html, HtmlServer } from "@effect/ui/html";
import { HtmlLocator, HtmlPlay, HtmlScene } from "@effect/ui/html/testing";
import { Story, TestHost } from "@effect/ui/testing";
import { Effect, Layer, Schema } from "effect";
import { describe, expect, it } from "vite-plus/test";
import { Button } from "@omnisuite/ui/effect/components/button";
import { DropdownMenu } from "@omnisuite/ui/effect/components/dropdown-menu";

const Message = UiSchema.TaggedEnum({
  SetOpen: { open: Schema.Boolean },
  SetShareOpen: { open: Schema.Boolean },
  Picked: { value: Schema.String, checked: Schema.optional(Schema.Boolean) },
});

const Model = Schema.Struct({
  open: Schema.Boolean,
  shareOpen: Schema.Boolean,
  pinned: Schema.Boolean,
  sort: Schema.String,
  picked: Schema.Array(Schema.String),
});

const ignored = {
  Highlighted: () => undefined,
  RequestedQuery: () => undefined,
  Settled: () => undefined,
};

// The same menu, closed or already open with its submenu.
const actionsMenu = (name: string, open: boolean) =>
  Html.component({ name, model: Model, message: Message }).make({
    init: () => ({ open, shareOpen: open, pinned: true, sort: "name", picked: [] }),
    update: {
      SetOpen: ($, { open }) => $.evolve({ open: () => open }),
      SetShareOpen: ($, { open }) => $.evolve({ shareOpen: () => open }),
      Picked: ($, { value, checked }) =>
        $.evolve({
          picked: (picked) => [...picked, value],
          pinned: (pinned) => (value === "pinned" ? checked === true : pinned),
          sort: (sort) => (value.startsWith("sort-") ? value.slice(5) : sort),
        }),
    },
    view: (h, model) =>
      DropdownMenu(h, {
        key: "actions",
        props: {
          open: model.open,
          items: [
            { value: "rename", label: "Rename" },
            { value: "duplicate", label: "Duplicate" },
            { value: "pinned", label: "Pinned", checked: model.pinned },
            { value: "sort-name", label: "Name", checked: model.sort === "name" },
            { value: "sort-date", label: "Date", checked: model.sort === "date" },
            { value: "share", label: "Share" },
            { value: "delete", label: "Delete", disabled: true },
          ],
        },
        onEmit: {
          ...ignored,
          RequestedOpen: () => Message.SetOpen({ open: true }),
          RequestedClose: () => Message.SetOpen({ open: false }),
          Picked: ({ value, checked }) =>
            Message.Picked(checked === undefined ? { value } : { value, checked }),
        },
        view: (menu) =>
          h.div(
            menu.trigger({ element: Button(h, { variant: "outline" }) }).children("Actions"),
            menu.content(h, [
              menu
                .group({ element: h.div, group: "edit" })
                .children(
                  menu.label({ element: h.div, group: "edit" }).children("Edit"),
                  menu
                    .item({ element: h.div, value: "rename" })
                    .children("Rename", menu.shortcut(h.span).children("⌘R")),
                  menu
                    .item({ element: h.div, value: "duplicate", inset: true })
                    .children("Duplicate"),
                ),
              menu.checkboxOption(h, { value: "pinned", label: "Pinned" }),
              menu.separator(h.div),
              menu
                .radioGroup(h.div)
                .children(
                  menu.radioOption(h, { value: "sort-name", label: "Name" }),
                  menu.radioOption(h, { value: "sort-date", label: "Date" }),
                ),
              DropdownMenu(h, {
                key: "share",
                props: {
                  open: model.shareOpen,
                  parentItem: "share",
                  items: [{ value: "email", label: "Email" }],
                },
                onEmit: {
                  ...ignored,
                  RequestedOpen: () => Message.SetShareOpen({ open: true }),
                  RequestedClose: () => Message.SetShareOpen({ open: false }),
                  Picked: ({ value }) => Message.Picked({ value }),
                },
                view: (share) =>
                  h.div(
                    menu.subTrigger(h, { element: share.submenuTrigger(h.div), value: "share" }, [
                      "Share",
                    ]),
                    share.content(h, [
                      share.item({ element: h.div, value: "email" }).children("Email"),
                    ]),
                  ),
              }),
              menu
                .item({ element: h.div, value: "delete", variant: "destructive" })
                .children("Delete"),
            ]),
          ),
      }),
  });

const Actions = actionsMenu("Actions", false);
const OpenActions = actionsMenu("OpenActions", true);

/** The opening tag of the first element whose `data-slot` is `slot` and that contains `text`. */
const tag = (html: string, slot: string, text = "") =>
  html.match(
    new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>(?=(?:(?!<\\/div>).)*${text})`),
  )?.[0] ?? "";

// The kit focuses and measures through the host. A host that does nothing keeps the play test
// on the wrapper's events rather than the browser's focus.
const NoopHtmlHost = Layer.succeed(Html.Host, {
  focus: () => {},
  blur: () => {},
  scrollIntoView: () => {},
  measure: () => ({ x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }),
  select: () => {},
  requestSubmit: () => false,
  showPicker: () => false,
});

const trigger = HtmlLocator.role("button", { name: "Actions" });
const menuRole = HtmlLocator.role("menu");
const item = (name: string) => HtmlLocator.role("menuitem", { name });
// Its shortcut is part of its name, as in React.
const rename = item("Rename⌘R");

describe("Effect DropdownMenu", () => {
  it("draws React's slots and classes, with the kit's highlight in place of focus", async () => {
    const { html } = await Effect.runPromise(HtmlServer.renderToHtml(OpenActions, {}));

    expect(tag(html, "dropdown-menu-trigger")).toContain('aria-haspopup="menu"');
    const positioner = tag(html, "dropdown-menu-positioner");
    expect(positioner).toContain("border-0 bg-transparent p-0");
    expect(positioner).toContain("isolate z-50 outline-none");
    expect(tag(html, "dropdown-menu-content")).toContain("rounded-lg bg-popover p-1");
    expect(tag(html, "dropdown-menu-content")).toContain('data-side="bottom"');

    const rename = tag(html, "dropdown-menu-item", "Rename");
    expect(rename).toContain('role="menuitem"');
    expect(rename).toContain('data-variant="default"');
    expect(rename).toContain("data-highlighted:bg-accent");
    expect(tag(html, "dropdown-menu-item", "Duplicate")).toContain("data-inset");
    expect(tag(html, "dropdown-menu-shortcut")).toContain("tracking-widest");
    expect(tag(html, "dropdown-menu-label")).toContain("text-muted-foreground");
    expect(tag(html, "dropdown-menu-separator")).toContain("h-px bg-border/50");

    const remove = tag(html, "dropdown-menu-item", "Delete");
    expect(remove).toContain('data-variant="destructive"');
    expect(remove).toContain("data-disabled");
    expect(remove).toContain('aria-disabled="true"');

    // The checked checkbox and radio items draw their indicator, the unchecked one doesn't.
    expect(tag(html, "dropdown-menu-checkbox-item")).toContain('aria-checked="true"');
    expect(html).toContain('data-slot="dropdown-menu-checkbox-item-indicator"');
    expect(tag(html, "dropdown-menu-radio-item", "Name")).toContain('aria-checked="true"');
    expect(tag(html, "dropdown-menu-radio-item", "Date")).toContain('aria-checked="false"');
    expect(html.match(/data-slot="dropdown-menu-radio-item-indicator"/g)).toHaveLength(1);

    // The submenu opens to the right of its trigger, and its popup gets React's sub content.
    const subTrigger = tag(html, "dropdown-menu-sub-trigger");
    expect(subTrigger).toContain('aria-haspopup="menu"');
    expect(subTrigger).toContain("data-popup-open:bg-accent");
    const subContent = tag(html, "dropdown-menu-sub-content");
    expect(subContent).toContain('data-side="right"');
    expect(subContent).toContain("w-auto");
  });

  it("maps the kit's events to the consumer's messages", () =>
    Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const s = yield* Story.make(Actions, {});
          s.send(Message.SetOpen({ open: true }));
          s.send(Message.Picked({ value: "pinned", checked: false }));
          expect(s.model.open).toBe(true);
          expect(s.model.pinned).toBe(false);

          const scene = yield* HtmlScene.make(Actions, {});
          scene
            .childEmit(DropdownMenu.kit, "actions", {
              _tag: "RequestedOpen",
              triggerId: null,
              reason: "trigger-press",
            })
            .expect(rename)
            .toExist()
            .childEmit(DropdownMenu.kit, "actions", {
              _tag: "Picked",
              value: "sort-date",
              checked: true,
            })
            .expect(HtmlLocator.role("menuitemradio", { name: "Date" }))
            .toHaveAttribute("aria-checked", "true");
        }),
      ),
    ));

  it("plays the kit's keyboard: arrows, typeahead, Enter, and skips a disabled item", () =>
    Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const play = yield* HtmlPlay.make(Actions, {});
          yield* play.keydown(trigger, "ArrowDown");
          yield* play.expect(menuRole).toExist();
          yield* play.expect(rename).toHaveAttribute("data-highlighted", "");

          yield* play.keydown(menuRole, "ArrowDown");
          yield* play.expect(item("Duplicate")).toHaveAttribute("data-highlighted", "");

          // Typeahead moves to the next item whose label starts with what's typed.
          yield* play.keydown(menuRole, "r");
          yield* play.expect(rename).toHaveAttribute("data-highlighted", "");

          yield* play.keydown(rename, "Enter");
          expect(play.root.model()?.picked).toEqual(["rename"]);
          yield* play.expect(trigger).toHaveAttribute("aria-expanded", "false");
          expect(play.root.model()?.picked).toEqual(["rename"]);
        }),
      ).pipe(Effect.provide(Layer.mergeAll(TestHost.layer(), NoopHtmlHost))),
    ));

  it("doesn't pick a disabled item", () =>
    Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const play = yield* HtmlPlay.make(Actions, {});
          yield* play.click(trigger);
          yield* play.expect(item("Delete")).toHaveAttribute("aria-disabled", "true");
          yield* play.click(item("Delete"));
          yield* play.keydown(menuRole, "End");
          yield* play.expect(item("Delete")).toHaveAttribute("data-highlighted", "");
          yield* play.keydown(item("Delete"), "Enter");
          expect(play.root.model()?.picked).toEqual([]);
          yield* play.expect(trigger).toHaveAttribute("aria-expanded", "true");
        }),
      ).pipe(Effect.provide(Layer.mergeAll(TestHost.layer(), NoopHtmlHost))),
    ));
});
