import { Html, HtmlServer } from "@effect/ui/html";
import { Effect, Schema } from "effect";
import { describe, it, expect } from "vite-plus/test";
import {
  InputGroup,
  InputGroupText,
  InputGroupAddon,
} from "@omnisuite/ui/effect/components/input-group";
import { UiSchema } from "@effect/ui";
import { HtmlScene, HtmlLocator } from "@effect/ui/html/testing";
import {
  InputGroupInput,
  InputGroupTextarea,
  InputGroupButton,
} from "@omnisuite/ui/effect/components/input-group";

const Sample = Html.component({
  name: "Input-groupSample",
  model: Schema.Struct({}),
  message: Schema.Never,
}).make({
  init: () => ({}),
  update: ($) => $.model,
  view: (h) =>
    h.div(
      InputGroup(h).class("p-9").children("InputGroup"),
      InputGroupText(h).class("p-9").children("InputGroupText"),
      InputGroupAddon(h, { align: "block-end" }).class("p-9").children("InputGroupAddon"),
    ),
});
describe("Effect input-group", () => {
  it("renders each public part and merges caller classes", async () => {
    const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Sample, {}));
    expect(html).toContain('data-slot="input-group"');
    expect(html).toContain('data-slot="input-group-text"');
    expect(html).toContain('data-slot="input-group-addon"');
    expect(html).toContain('data-align="block-end"');
    expect(html).toContain("order-last");
    expect(html).toContain("p-9");
    expect(html).not.toMatch(/class="[^"]*\bp-6\b/);
  });
});

const Message = UiSchema.TaggedEnum({ Updated: { value: Schema.String }, Pressed: {} });
const Controls = Html.component({
  name: "GroupControls",
  model: Schema.Struct({ value: Schema.String }),
  message: Message,
}).make({
  init: () => ({ value: "" }),
  update: { Updated: ($, { value }) => $.evolve({ value: () => value }), Pressed: ($) => $.model },
  view: (h, model) =>
    InputGroup(h).children(
      InputGroupInput(h, {
        props: { value: model.value },
        onUpdate: ({ value }) => Message.Updated({ value }),
      }).attr("aria-label", "Search"),
      InputGroupTextarea(h, { value: model.value }).attr("aria-label", "Notes"),
      InputGroupButton(h, { size: "icon-sm", onPress: Message.Pressed() }).children("Search"),
    ),
});
it("composes controls and preserves the input update message", async () => {
  const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Controls, {}));
  expect(html.match(/data-slot="input-group-control"/g)).toHaveLength(2);
  expect(html).toContain('data-size="icon-sm"');
  expect(html).toContain("size-7");
  await Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const scene = yield* HtmlScene.make(Controls, {});
        scene
          .type(HtmlLocator.role("textbox", { name: "Search" }), "Design")
          .expect(HtmlLocator.role("textbox", { name: "Search" }))
          .toHaveValue("Design");
      }),
    ),
  );
});
