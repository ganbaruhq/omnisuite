import { Html, HtmlServer } from "@effect/ui/html";
import { Effect, Schema } from "effect";
import { expect, it } from "vite-plus/test";
import { Text } from "@omnisuite/ui/effect/components/text";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Text as ReactText } from "@omnisuite/ui/components/text";
import type { TextOptions } from "@omnisuite/ui/effect/components/text";

const Sample = Html.component({
  name: "Typography",
  model: Schema.Struct({}),
  message: Schema.Never,
}).make({
  init: () => ({}),
  update: ($) => $.model,
  view: (h) =>
    h.div(
      Text(h).children("Body"),
      Text(h, { variant: "heading", size: "lg", as: "h1" }).children("Heading"),
      Text(h, { variant: "mono-secondary" }).children("Code"),
      Text(h, { variant: "secondary", size: "sm", bold: true, truncate: true })
        .class("text-error")
        .children("Helper"),
    ),
});
it("uses semantic tags and typography variants with caller overrides", async () => {
  const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Sample, {}));
  expect(html).toMatch(/<p[^>]*data-variant="body"/);
  expect(html).toMatch(/<h1[^>]*data-variant="heading"[^>]*class="[^"]*text-xl/);
  expect(html).toContain("font-mono");
  expect(html).toContain("truncate");
  expect(html).toContain("font-medium");
  expect(html).toContain("text-error");
});

const copyOptions = (["body", "secondary", "success", "error"] as const).flatMap((variant) =>
  (["xs", "sm", "base", "lg"] as const).flatMap((size) =>
    [false, true].map((bold) => ({ variant, size, bold, truncate: true })),
  ),
);
const fixedOptions = [
  { variant: "heading" },
  { variant: "heading", size: "lg" },
  ...(["mono", "mono-secondary"] as const).flatMap(
    (variant) => [{ variant }, { variant, size: "lg" }] satisfies TextOptions[],
  ),
] satisfies TextOptions[];
it.for([...copyOptions, ...fixedOptions])(
  "matches React typography classes: %j",
  async (options) => {
    const Example = Html.component({
      name: "TypographyVariants",
      model: Schema.Struct({}),
      message: Schema.Never,
    }).make({
      init: () => ({}),
      update: ($) => $.model,
      view: (h) => Text(h, options).class("text-primary"),
    });
    const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Example, {}));
    const react = renderToStaticMarkup(
      createElement(ReactText, { ...options, className: "text-primary" }),
    );
    expect(html.match(/class="[^"]*"/)?.[0]).toBe(react.match(/class="[^"]*"/)?.[0]);
  },
);
