import { Html, HtmlServer } from "@effect/ui/html";
import { Effect, Schema } from "effect";
import { describe, it, expect } from "vite-plus/test";
import { BadgeDot, BadgeImage, Badge } from "@omnisuite/ui/effect/components/badge";
import { BadgeWithButton } from "@omnisuite/ui/effect/components/badge";

const Sample = Html.component({
  name: "BadgeSample",
  model: Schema.Struct({}),
  message: Schema.Never,
}).make({
  init: () => ({}),
  update: ($) => $.model,
  view: (h) =>
    h.div(
      BadgeDot(h).class("p-9").children("BadgeDot"),
      BadgeImage(h).class("p-9").attrs({ src: "avatar.png", alt: "" }),
      Badge(h, { variant: "modern", size: "lg", color: "success" }).class("p-9").children("Badge"),
    ),
});
describe("Effect badge", () => {
  it("renders each public part and merges caller classes", async () => {
    const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Sample, {}));
    expect(html).toContain('data-slot="badge-dot"');
    expect(html).toContain('data-slot="badge-image"');
    expect(html).toContain('data-slot="badge"');
    expect(html).toContain('data-variant="modern"');
    expect(html).toContain("shadow-xs");
    expect(html).toContain("p-9");
    expect(html).not.toMatch(/class="[^"]*\bp-6\b/);
  });
});

const Removable = Html.component({
  name: "RemovableBadge",
  model: Schema.Struct({}),
  message: Schema.Never,
}).make({
  init: () => ({}),
  update: ($) => $.model,
  view: (h) => BadgeWithButton(h, { buttonLabel: "Remove design", children: ["Design"] }),
});
it("renders a named remove button with the Tabler close icon", async () => {
  const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Removable, {}));
  expect(html).toContain('data-slot="badge-button"');
  expect(html).toContain('aria-label="Remove design"');
  expect(html).toContain("tabler-icon-x");
});
