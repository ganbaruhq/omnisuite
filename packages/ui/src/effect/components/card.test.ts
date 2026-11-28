import { Html, HtmlServer } from "@effect/ui/html";
import { Effect, Schema } from "effect";
import { describe, it, expect } from "vite-plus/test";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@omnisuite/ui/effect/components/card";
const Sample = Html.component({
  name: "CardSample",
  model: Schema.Struct({}),
  message: Schema.Never,
}).make({
  init: () => ({}),
  update: ($) => $.model,
  view: (h) =>
    h.div(
      Card(h, { size: "sm" }).class("p-9").children("Card"),
      CardHeader(h).class("p-9").children("CardHeader"),
      CardTitle(h).class("p-9").children("CardTitle"),
      CardDescription(h).class("p-9").children("CardDescription"),
      CardAction(h).class("p-9").children("CardAction"),
      CardContent(h).class("p-9").children("CardContent"),
      CardFooter(h).class("p-9").children("CardFooter"),
    ),
});
describe("Effect card", () => {
  it("renders each public part and merges caller classes", async () => {
    const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Sample, {}));
    expect(html).toContain('data-slot="card"');
    expect(html).toContain('data-slot="card-header"');
    expect(html).toContain('data-slot="card-title"');
    expect(html).toContain('data-slot="card-description"');
    expect(html).toContain('data-slot="card-action"');
    expect(html).toContain('data-slot="card-content"');
    expect(html).toContain('data-slot="card-footer"');
    expect(html).toContain('data-size="sm"');
    expect(html).toContain("ring-1");
    expect(html).toContain("p-9");
    expect(html).not.toMatch(/class="[^"]*\bp-6\b/);
  });
});
