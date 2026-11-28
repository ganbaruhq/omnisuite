import { Html, HtmlServer } from "@effect/ui/html";
import { Effect, Schema } from "effect";
import { describe, it, expect } from "vite-plus/test";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "@omnisuite/ui/effect/components/empty";
const Sample = Html.component({
  name: "EmptySample",
  model: Schema.Struct({}),
  message: Schema.Never,
}).make({
  init: () => ({}),
  update: ($) => $.model,
  view: (h) =>
    h.div(
      Empty(h).class("p-9").children("Empty"),
      EmptyHeader(h).class("p-9").children("EmptyHeader"),
      EmptyTitle(h).class("p-9").children("EmptyTitle"),
      EmptyDescription(h).class("p-9").children("EmptyDescription"),
      EmptyContent(h).class("p-9").children("EmptyContent"),
      EmptyMedia(h, { variant: "icon" }).class("p-9").children("EmptyMedia"),
    ),
});
describe("Effect empty", () => {
  it("renders each public part and merges caller classes", async () => {
    const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Sample, {}));
    expect(html).toContain('data-slot="empty"');
    expect(html).toContain('data-slot="empty-header"');
    expect(html).toContain('data-slot="empty-title"');
    expect(html).toContain('data-slot="empty-description"');
    expect(html).toContain('data-slot="empty-content"');
    expect(html).toContain('data-slot="empty-icon"');
    expect(html).toContain('data-variant="icon"');
    expect(html).toContain("size-8");
    expect(html).toContain("p-9");
    expect(html).not.toMatch(/class="[^"]*\bp-6\b/);
  });
});
