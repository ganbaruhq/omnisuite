import { Html, HtmlServer } from "@effect/ui/html";
import { Effect, Schema } from "effect";
import { describe, it, expect } from "vite-plus/test";
import { TagGroup, Tag, TagCount, TagContent } from "@omnisuite/ui/effect/components/tag";
const Sample = Html.component({
  name: "TagSample",
  model: Schema.Struct({}),
  message: Schema.Never,
}).make({
  init: () => ({}),
  update: ($) => $.model,
  view: (h) =>
    h.div(
      TagGroup(h).class("p-9").children("TagGroup"),
      Tag(h, { size: "lg" })
        .class("p-9")
        .children(TagContent(h, { size: "lg" }).children("Tag")),
      TagCount(h).class("p-9").children("TagCount"),
    ),
});
describe("Effect tag", () => {
  it("renders each public part and merges caller classes", async () => {
    const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Sample, {}));
    expect(html).toContain('data-slot="tag-group"');
    expect(html).toContain('data-slot="tag"');
    expect(html).toContain('data-slot="tag-count"');
    expect(html).toContain('data-size="lg"');
    expect(html).toContain("text-sm/5");
    expect(html).toContain("p-9");
    expect(html).not.toMatch(/class="[^"]*\bp-6\b/);
  });
});
