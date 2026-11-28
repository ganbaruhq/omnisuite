import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { HtmlLocator, HtmlScene } from "@effect/ui/html/testing";
import { Effect, Schema } from "effect";
import { it } from "vite-plus/test";
import { Combobox } from "@omnisuite/ui/effect/components/combobox";

const Message = UiSchema.TaggedEnum({
  Opened: { open: Schema.Boolean },
  Typed: { inputValue: Schema.String },
  Picked: { value: Schema.Union([Schema.String, Schema.Array(Schema.String), Schema.Null]) },
  Highlighted: { value: Schema.NullOr(Schema.String) },
  Settled: { open: Schema.Boolean },
});
const items = [
  { value: "design", label: "Design" },
  { value: "engineering", label: "Engineering" },
  { value: "archived", label: "Archived", disabled: true },
];
const Example = Html.component({
  name: "ComboboxExample",
  model: Schema.Struct({
    open: Schema.Boolean,
    inputValue: Schema.String,
    value: Schema.Union([Schema.String, Schema.Array(Schema.String), Schema.Null]),
    highlighted: Schema.NullOr(Schema.String),
    settled: Schema.Boolean,
  }),
  message: Message,
}).make({
  init: () => ({ open: false, inputValue: "", value: null, highlighted: null, settled: false }),
  update: {
    Opened: ($, { open }) => $.evolve({ open: () => open }),
    Typed: ($, { inputValue }) => $.evolve({ inputValue: () => inputValue }),
    Picked: ($, { value }) => $.evolve({ value: () => value }),
    Highlighted: ($, { value }) => $.evolve({ highlighted: () => value }),
    Settled: ($, { open }) => $.evolve({ settled: () => open }),
  },
  view: (h, model) =>
    h.div(
      Combobox(h, {
        props: {
          open: model.open,
          inputValue: model.inputValue,
          value: model.value,
          items,
          filter: "none",
        },
        onEmit: {
          RequestedOpen: () => Message.Opened({ open: true }),
          RequestedClose: () => Message.Opened({ open: false }),
          RequestedInputValue: Message.Typed,
          Picked: Message.Picked,
          Highlighted: Message.Highlighted,
          Settled: Message.Settled,
        },
        view: (combo) =>
          h.div(
            combo.control(h, { label: "Team" }),
            combo.content(
              h,
              combo.items.map((item) => combo.option(h, item)),
            ),
          ),
      }),
      h.output.attr("aria-label", "Events").children(`${model.highlighted} / ${model.settled}`),
    ),
});

const Disabled = Html.component({
  name: "DisabledCombobox",
  model: Schema.Struct({}),
  message: Schema.Never,
}).make({
  init: () => ({}),
  update: ($) => $.model,
  view: (h) =>
    Combobox(h, {
      props: { open: false, inputValue: "Design", value: "design", items, disabled: true },
      onEmit: {
        RequestedOpen: () => undefined,
        RequestedClose: () => undefined,
        RequestedInputValue: () => undefined,
        Picked: () => undefined,
        Highlighted: () => undefined,
        Settled: () => undefined,
      },
      view: (combo) => combo.control(h, { label: "Disabled team" }),
    }),
});

it("Combobox disables both input and trigger while keeping their visual state", () =>
  Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const scene = yield* HtmlScene.make(Disabled, {});
        const input = HtmlLocator.role("combobox", { name: "Disabled team" });
        scene
          .expect(input)
          .toHaveAttribute("disabled", "")
          .expect(input)
          .toHaveAttribute("data-disabled", "")
          .expect(input)
          .toHaveAttribute("class", /disabled:opacity-50/)
          .expect(HtmlLocator.role("button", { name: "Show Disabled team options" }))
          .toHaveAttribute("disabled", "");
      }),
    ),
  ));

it("Combobox maps all onEmit events and renders selected, highlighted and disabled options with ARIA", () =>
  Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const scene = yield* HtmlScene.make(Example, {});
        const input = HtmlLocator.role("combobox", { name: "Team" });
        const design = HtmlLocator.role("option", { name: "Design" });
        scene
          .expect(input)
          .toHaveAttribute("aria-expanded", "false")
          .childEmit(Combobox.kit, { _tag: "RequestedOpen", reason: "input-press" })
          .expect(input)
          .toHaveAttribute("aria-expanded", "true")
          .expect(design)
          .toHaveAttribute("data-slot", "combobox-item")
          .expect(design)
          .toHaveAttribute("class", /data-highlighted:bg-accent/)
          .expect(HtmlLocator.role("option", { name: "Archived" }))
          .toHaveAttribute("aria-disabled", "true")
          .childEmit(Combobox.kit, {
            _tag: "RequestedInputValue",
            inputValue: "Design",
            reason: "input-change",
          })
          .expect(input)
          .toHaveValue("Design")
          .childEmit(Combobox.kit, { _tag: "Picked", value: "design", reason: "item-press" })
          .expect(design)
          .toHaveAttribute("aria-selected", "true")
          .expect(design)
          .toHaveAttribute("data-selected", "")
          .childEmit(Combobox.kit, {
            _tag: "Highlighted",
            value: "design",
            index: 0,
            reason: "keyboard",
          })
          .childEmit(Combobox.kit, { _tag: "Settled", open: true })
          .expect(HtmlLocator.role("status", { name: "Events" }))
          .toHaveText("design / true")
          .childEmit(Combobox.kit, { _tag: "RequestedClose", reason: "escape-key" })
          .expect(input)
          .toHaveAttribute("aria-expanded", "false");
      }),
    ),
  ));
