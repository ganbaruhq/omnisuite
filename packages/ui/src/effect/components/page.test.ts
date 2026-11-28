import { Html, HtmlServer } from "@effect/ui/html";
import { Effect, Schema } from "effect";
import { describe, it, expect } from "vite-plus/test";
import {
  Page,
  PageFullBleed,
  PageHeader,
  PageHeading,
  PageTitle,
  PageDescription,
  PageActions,
  PageSection,
  PageSectionTitle,
  PageBody,
  PageAside,
  PageAsideContent,
} from "@omnisuite/ui/effect/components/page";
const Sample = Html.component({
  name: "PageSample",
  model: Schema.Struct({}),
  message: Schema.Never,
}).make({
  init: () => ({}),
  update: ($) => $.model,
  view: (h) =>
    h.div(
      Page(h).class("p-9").children("Page"),
      PageFullBleed(h).class("p-9").children("PageFullBleed"),
      PageHeader(h).class("p-9").children("PageHeader"),
      PageHeading(h).class("p-9").children("PageHeading"),
      PageTitle(h).class("p-9").children("PageTitle"),
      PageDescription(h).class("p-9").children("PageDescription"),
      PageActions(h).class("p-9").children("PageActions"),
      PageSection(h).class("p-9").children("PageSection"),
      PageSectionTitle(h).class("p-9").children("PageSectionTitle"),
      PageBody(h).class("p-9").children("PageBody"),
      PageAside(h).class("p-9").children(PageAsideContent(h).class("p-9").children("PageAside")),
    ),
});
describe("Effect page", () => {
  it("renders each public part and merges caller classes", async () => {
    const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Sample, {}));
    expect(html).toContain('data-slot="page"');
    expect(html).toContain('data-slot="page-full-bleed"');
    expect(html).toContain('data-slot="page-header"');
    expect(html).toContain('data-slot="page-heading"');
    expect(html).toContain('data-slot="page-title"');
    expect(html).toContain('data-slot="page-description"');
    expect(html).toContain('data-slot="page-actions"');
    expect(html).toContain('data-slot="page-section"');
    expect(html).toContain('data-slot="page-section-title"');
    expect(html).toContain('data-slot="page-body"');
    expect(html).toContain('data-slot="page-aside"');
    expect(html).toContain('data-slot="page-title"');
    expect(html).toMatch(/<h1[^>]*data-slot="page-title"/);
    expect(html).toMatch(/<h2[^>]*data-slot="page-section-title"/);
    expect(html).toContain("sticky");
    expect(html).toContain("font-heading");
    expect(html).toContain("p-9");
    expect(html).not.toMatch(/class="[^"]*\bp-6\b/);
  });
});
