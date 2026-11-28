import { Html, HtmlServer } from "@effect/ui/html";
import { Effect, Schema } from "effect";
import { describe, it, expect } from "vite-plus/test";
import {
  LayerCard,
  LayerCardPrimary,
  LayerCardSecondary,
} from "@omnisuite/ui/effect/components/layer-card";
const Sample = Html.component({
  name: "Layer-cardSample",
  model: Schema.Struct({}),
  message: Schema.Never,
}).make({
  init: () => ({}),
  update: ($) => $.model,
  view: (h) =>
    h.div(
      LayerCard(h).class("p-9").children("LayerCard"),
      LayerCardPrimary(h).class("p-9").children("LayerCardPrimary"),
      LayerCardSecondary(h).class("p-9").children("LayerCardSecondary"),
    ),
});
describe("Effect layer-card", () => {
  it("renders each public part and merges caller classes", async () => {
    const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Sample, {}));
    expect(html).toContain('data-slot="layer-card"');
    expect(html).toContain('data-slot="layer-card-primary"');
    expect(html).toContain('data-slot="layer-card-secondary"');
    expect(html).toContain('data-slot="layer-card"');
    expect(html).toContain("ring-border");
    expect(html).toContain("p-9");
    expect(html).not.toMatch(/class="[^"]*\bp-6\b/);
  });
});
