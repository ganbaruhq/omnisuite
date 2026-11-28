import { Html, HtmlServer } from "@effect/ui/html";
import { Effect, Schema } from "effect";
import { describe, it, expect } from "vite-plus/test";
import { Skeleton } from "@omnisuite/ui/effect/components/skeleton";
const Sample = Html.component({
  name: "SkeletonSample",
  model: Schema.Struct({}),
  message: Schema.Never,
}).make({
  init: () => ({}),
  update: ($) => $.model,
  view: (h) => h.div(Skeleton(h).class("p-9").children("Skeleton")),
});
describe("Effect skeleton", () => {
  it("renders each public part and merges caller classes", async () => {
    const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Sample, {}));
    expect(html).toContain('data-slot="skeleton"');
    expect(html).toContain('data-slot="skeleton"');
    expect(html).toContain("animate-pulse");
    expect(html).toContain("p-9");
    expect(html).not.toMatch(/class="[^"]*\bp-6\b/);
  });
});
