import { Html, HtmlServer } from "@effect/ui/html";
import { Effect, Schema } from "effect";
import { describe, it, expect } from "vite-plus/test";
import { StatusDot } from "@omnisuite/ui/effect/components/status-dot";
const Sample = Html.component({
  name: "Status-dotSample",
  model: Schema.Struct({}),
  message: Schema.Never,
}).make({
  init: () => ({}),
  update: ($) => $.model,
  view: (h) =>
    h.div(StatusDot(h, { status: "success", pulse: true }).class("p-9").children("StatusDot")),
});
describe("Effect status-dot", () => {
  it("renders each public part and merges caller classes", async () => {
    const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Sample, {}));
    expect(html).toContain('data-slot="status-dot"');
    expect(html).toContain('data-status="success"');
    expect(html).toContain("bg-success");
    expect(html).toContain("p-9");
    expect(html).not.toMatch(/class="[^"]*\bp-6\b/);
  });
});

const Named = Html.component({
  name: "NamedStatus",
  model: Schema.Struct({}),
  message: Schema.Never,
}).make({
  init: () => ({}),
  update: ($) => $.model,
  view: (h) => StatusDot(h, { status: "warning" }).attr("aria-label", "Needs attention"),
});
it("exposes a caller-labelled dot as an image instead of hiding it", async () => {
  const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Named, {}));
  expect(html).toContain('role="img"');
  expect(html).not.toContain("aria-hidden");
});
