import { Html, HtmlServer } from "@effect/ui/html";
import { Effect, Schema } from "effect";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vite-plus/test";
import { Card } from "@omnisuite/ui/effect/components/card";
import { Card as ReactCard } from "@omnisuite/ui/components/card";
it.for([{ size: "default" }, { size: "sm" }] as const)(
  "Card matches React variant classes: %j",
  async (options) => {
    const Sample = Html.component({
      name: "CardVariants",
      model: Schema.Struct({}),
      message: Schema.Never,
    }).make({
      init: () => ({}),
      update: ($) => $.model,
      view: (h) => Card(h, options).class("p-9"),
    });
    const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Sample, {}));
    const react = renderToStaticMarkup(createElement(ReactCard, { ...options, className: "p-9" }));
    expect(classes(html)).toBe(classes(react));
  },
);
import { Badge } from "@omnisuite/ui/effect/components/badge";
import { Badge as ReactBadge } from "@omnisuite/ui/components/badge";
it.for(
  (["pill-color", "color", "modern"] as const).flatMap((variant) =>
    (
      [
        "gray",
        "brand",
        "error",
        "warning",
        "success",
        "slate",
        "sky",
        "blue",
        "indigo",
        "purple",
        "pink",
        "orange",
      ] as const
    ).flatMap((color) => (["sm", "md", "lg"] as const).map((size) => ({ variant, color, size }))),
  ),
)("Badge matches React variant classes: %j", async (options) => {
  const Sample = Html.component({
    name: "BadgeVariants",
    model: Schema.Struct({}),
    message: Schema.Never,
  }).make({
    init: () => ({}),
    update: ($) => $.model,
    view: (h) => Badge(h, options).class("p-9"),
  });
  const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Sample, {}));
  const react = renderToStaticMarkup(createElement(ReactBadge, { ...options, className: "p-9" }));
  expect(classes(html)).toBe(classes(react));
});
import { EmptyMedia } from "@omnisuite/ui/effect/components/empty";
import { EmptyMedia as ReactEmptyMedia } from "@omnisuite/ui/components/empty";
it.for([{ variant: "default" }, { variant: "icon" }] as const)(
  "EmptyMedia matches React variant classes: %j",
  async (options) => {
    const Sample = Html.component({
      name: "EmptyMediaVariants",
      model: Schema.Struct({}),
      message: Schema.Never,
    }).make({
      init: () => ({}),
      update: ($) => $.model,
      view: (h) => EmptyMedia(h, options).class("p-9"),
    });
    const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Sample, {}));
    const react = renderToStaticMarkup(
      createElement(ReactEmptyMedia, { ...options, className: "p-9" }),
    );
    expect(classes(html)).toBe(classes(react));
  },
);
import { Tag } from "@omnisuite/ui/effect/components/tag";
import { Tag as ReactTag } from "@omnisuite/ui/components/tag";
it.for([{ size: "sm" }, { size: "md" }, { size: "lg" }] as const)(
  "Tag matches React variant classes: %j",
  async (options) => {
    const Sample = Html.component({
      name: "TagVariants",
      model: Schema.Struct({}),
      message: Schema.Never,
    }).make({
      init: () => ({}),
      update: ($) => $.model,
      view: (h) => Tag(h, options).class("p-9"),
    });
    const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Sample, {}));
    const react = renderToStaticMarkup(createElement(ReactTag, { ...options, className: "p-9" }));
    expect(classes(html)).toBe(classes(react));
  },
);
import { StatusDot } from "@omnisuite/ui/effect/components/status-dot";
import { StatusDot as ReactStatusDot } from "@omnisuite/ui/components/status-dot";
it.for(
  (["success", "warning", "destructive", "info", "neutral"] as const).flatMap((status) =>
    [false, true].map((pulse) => ({ status, pulse })),
  ),
)("StatusDot matches React variant classes: %j", async (options) => {
  const Sample = Html.component({
    name: "StatusDotVariants",
    model: Schema.Struct({}),
    message: Schema.Never,
  }).make({
    init: () => ({}),
    update: ($) => $.model,
    view: (h) => StatusDot(h, options).class("p-9"),
  });
  const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Sample, {}));
  const react = renderToStaticMarkup(
    createElement(ReactStatusDot, { ...options, className: "p-9" }),
  );
  expect(classes(html)).toBe(classes(react));
});
import { InputGroup } from "@omnisuite/ui/effect/components/input-group";
import { InputGroup as ReactInputGroup } from "@omnisuite/ui/components/input-group";
it.for((["xs", "sm", "default", "md", "lg"] as const).map((size) => ({ size })))(
  "InputGroup matches React variant classes: %j",
  async (options) => {
    const Sample = Html.component({
      name: "InputGroupVariants",
      model: Schema.Struct({}),
      message: Schema.Never,
    }).make({
      init: () => ({}),
      update: ($) => $.model,
      view: (h) => InputGroup(h, options).class("p-9"),
    });
    const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Sample, {}));
    const react = renderToStaticMarkup(
      createElement(ReactInputGroup, { ...options, className: "p-9" }),
    );
    expect(classes(html)).toBe(classes(react));
  },
);
import { InputGroupAddon } from "@omnisuite/ui/effect/components/input-group";
import { InputGroupAddon as ReactInputGroupAddon } from "@omnisuite/ui/components/input-group";
it.for(
  (["inline-start", "inline-end", "block-start", "block-end"] as const).map((align) => ({ align })),
)("InputGroupAddon matches React variant classes: %j", async (options) => {
  const Sample = Html.component({
    name: "InputGroupAddonVariants",
    model: Schema.Struct({}),
    message: Schema.Never,
  }).make({
    init: () => ({}),
    update: ($) => $.model,
    view: (h) => InputGroupAddon(h, options).class("p-9"),
  });
  const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Sample, {}));
  const react = renderToStaticMarkup(
    createElement(ReactInputGroupAddon, { ...options, className: "p-9" }),
  );
  expect(classes(html)).toBe(classes(react));
});
import { InputGroupButton } from "@omnisuite/ui/effect/components/input-group";
import { InputGroupButton as ReactInputGroupButton } from "@omnisuite/ui/components/input-group";
it.for((["xs", "sm", "icon-xs", "icon-sm"] as const).map((size) => ({ size })))(
  "InputGroupButton matches React variant classes: %j",
  async (options) => {
    const Sample = Html.component({
      name: "InputGroupButtonVariants",
      model: Schema.Struct({}),
      message: Schema.Never,
    }).make({
      init: () => ({}),
      update: ($) => $.model,
      view: (h) => InputGroupButton(h, options).class("p-9"),
    });
    const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Sample, {}));
    const react = renderToStaticMarkup(
      createElement(ReactInputGroupButton, { ...options, className: "p-9" }),
    );
    expect(classes(html)).toBe(classes(react));
  },
);
import { ButtonGroup } from "@omnisuite/ui/effect/components/button-group";
import { ButtonGroup as ReactButtonGroup } from "@omnisuite/ui/components/button-group";
it.for([{ orientation: "horizontal" }, { orientation: "vertical" }] as const)(
  "ButtonGroup matches React variant classes: %j",
  async (options) => {
    const Sample = Html.component({
      name: "ButtonGroupVariants",
      model: Schema.Struct({}),
      message: Schema.Never,
    }).make({
      init: () => ({}),
      update: ($) => $.model,
      view: (h) => ButtonGroup(h, options).class("p-9"),
    });
    const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Sample, {}));
    const react = renderToStaticMarkup(
      createElement(ReactButtonGroup, { ...options, className: "p-9" }),
    );
    expect(classes(html)).toBe(classes(react));
  },
);

const classes = (html: string) => /class="([^"]*)"/.exec(html)?.[1]?.replaceAll("&#x27;", "'");
