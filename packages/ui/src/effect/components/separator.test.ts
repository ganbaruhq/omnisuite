import { Html, HtmlServer } from "@effect/ui/html";
import { Effect, Schema } from "effect";
import { expect, it } from "vite-plus/test";
import { Separator } from "@omnisuite/ui/effect/components/separator";
const Sample = Html.component({
  name: "Separators",
  model: Schema.Struct({}),
  message: Schema.Never,
}).make({
  init: () => ({}),
  update: ($) => $.model,
  view: (h) =>
    h.div(Separator(h), Separator(h, { props: { orientation: "vertical" } }).class("bg-primary")),
});
it("retains kit separator semantics and orientation styling", async () => {
  const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Sample, {}));
  expect(html).toContain('role="separator"');
  expect(html).toContain('aria-orientation="vertical"');
  expect(html).toContain("data-vertical");
  expect(html).toContain("data-horizontal");
  expect(html).toContain("bg-primary");
});
