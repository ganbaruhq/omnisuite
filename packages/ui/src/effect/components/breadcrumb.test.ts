import { Html, HtmlServer } from "@effect/ui/html";
import { Effect, Schema } from "effect";
import { describe, it, expect } from "vite-plus/test";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@omnisuite/ui/effect/components/breadcrumb";
const Sample = Html.component({
  name: "BreadcrumbSample",
  model: Schema.Struct({}),
  message: Schema.Never,
}).make({
  init: () => ({}),
  update: ($) => $.model,
  view: (h) =>
    h.div(
      Breadcrumb(h),
      BreadcrumbList(h).class("p-9").children("BreadcrumbList"),
      BreadcrumbItem(h).class("p-9").children("BreadcrumbItem"),
      BreadcrumbLink(h).class("p-9").children("BreadcrumbLink"),
      BreadcrumbPage(h).class("p-9").children("BreadcrumbPage"),
      BreadcrumbSeparator(h).class("p-9").children("BreadcrumbSeparator"),
      BreadcrumbEllipsis(h).class("p-9").children("BreadcrumbEllipsis"),
    ),
});
describe("Effect breadcrumb", () => {
  it("renders each public part and merges caller classes", async () => {
    const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Sample, {}));
    expect(html).toContain('data-slot="breadcrumb-list"');
    expect(html).toContain('data-slot="breadcrumb-item"');
    expect(html).toContain('data-slot="breadcrumb-link"');
    expect(html).toContain('data-slot="breadcrumb-page"');
    expect(html).toContain('data-slot="breadcrumb-separator"');
    expect(html).toContain('data-slot="breadcrumb-ellipsis"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('aria-label="breadcrumb"');
    expect(html).toMatch(/<a[^>]*data-slot="breadcrumb-link"/);
    expect(html).toContain("tabler-icon-chevron-right");
    expect(html).toContain("tabler-icon-dots");
    expect(html).toContain("font-normal");
    expect(html).toContain("p-9");
    expect(html).not.toMatch(/class="[^"]*\bp-6\b/);
  });
});
