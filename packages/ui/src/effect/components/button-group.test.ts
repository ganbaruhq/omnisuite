import { Html, HtmlServer } from "@effect/ui/html";
import { Effect, Schema } from "effect";
import { describe, it, expect } from "vite-plus/test";
import { ButtonGroupText, ButtonGroup } from "@omnisuite/ui/effect/components/button-group";
import { ButtonGroupSeparator } from "@omnisuite/ui/effect/components/button-group";

const Sample = Html.component({
  name: "Button-groupSample",
  model: Schema.Struct({}),
  message: Schema.Never,
}).make({
  init: () => ({}),
  update: ($) => $.model,
  view: (h) =>
    h.div(
      ButtonGroupText(h).class("p-9").children("ButtonGroupText"),
      ButtonGroup(h, { orientation: "vertical" }).class("p-9").children("ButtonGroup"),
    ),
});
describe("Effect button-group", () => {
  it("renders each public part and merges caller classes", async () => {
    const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Sample, {}));
    expect(html).toContain('data-slot="button-group"');
    expect(html).toContain('data-slot="button-group"');
    expect(html).toContain('data-orientation="vertical"');
    expect(html).toContain("flex-col");
    expect(html).toContain("p-9");
    expect(html).not.toMatch(/class="[^"]*\bp-6\b/);
  });
});

const Dividers = Html.component({
  name: "GroupDividers",
  model: Schema.Struct({}),
  message: Schema.Never,
}).make({
  init: () => ({}),
  update: ($) => $.model,
  view: (h) =>
    ButtonGroup(h).children(
      ButtonGroupSeparator(h).class("bg-primary"),
      ButtonGroupText(h).children("Actions"),
    ),
});
it("composes a vertical kit separator and group text", async () => {
  const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Dividers, {}));
  expect(html).toContain('data-slot="button-group-separator"');
  expect(html).toContain('aria-orientation="vertical"');
  expect(html).toContain('data-slot="button-group-text"');
  expect(html).toContain("bg-primary");
});
