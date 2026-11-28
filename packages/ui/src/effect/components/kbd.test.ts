import { Html, HtmlServer } from "@effect/ui/html";
import { Effect, Schema } from "effect";
import { describe, it, expect } from "vite-plus/test";
import { Kbd, KbdGroup } from "@omnisuite/ui/effect/components/kbd";
const Sample = Html.component({
  name: "KbdSample",
  model: Schema.Struct({}),
  message: Schema.Never,
}).make({
  init: () => ({}),
  update: ($) => $.model,
  view: (h) =>
    h.div(Kbd(h).class("p-9").children("Kbd"), KbdGroup(h).class("p-9").children("KbdGroup")),
});
describe("Effect kbd", () => {
  it("renders each public part and merges caller classes", async () => {
    const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Sample, {}));
    expect(html).toContain('data-slot="kbd"');
    expect(html).toContain('data-slot="kbd-group"');
    expect(html).toContain('data-slot="kbd"');
    expect(html).toContain("h-5");
    expect(html).toContain("p-9");
    expect(html).not.toMatch(/class="[^"]*\bp-6\b/);
  });
});
