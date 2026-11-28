import { UiSchema } from "@effect/ui";
import { Html, HtmlServer } from "@effect/ui/html";
import { HtmlLocator, HtmlPlay } from "@effect/ui/html/testing";
import { TestHost } from "@effect/ui/testing";
import { Effect, Schema } from "effect";
import { describe, expect, it } from "vite-plus/test";
import { Toolbar } from "@omnisuite/ui/effect/components/toolbar";

const Message = UiSchema.TaggedEnum({ Refreshed: {} });

const Tools = Html.component({
  name: "ListTools",
  model: Schema.Struct({ refreshes: Schema.Number }),
  message: Message,
}).make({
  init: () => ({ refreshes: 0 }),
  update: { Refreshed: ($) => $.evolve({ refreshes: (n) => n + 1 }) },
  view: (h, model) =>
    Toolbar(h, {
      props: { items: [{ value: "refresh" }, { value: "archive", disabled: true }] },
      view: (toolbar) =>
        toolbar
          .root(h.div)
          .class("h-10")
          .attr("aria-label", "List actions")
          .children(
            toolbar
              .button({ element: h.button.on("click", Message.Refreshed()), value: "refresh" })
              .children(`Refresh (${model.refreshes})`),
            toolbar
              .button({ element: h.button, value: "archive", variant: "outline", size: "icon" })
              .attr("aria-label", "Archive"),
          ),
    }),
});

describe("Effect Toolbar", () => {
  it("draws React's joined strip on the kit's toolbar, the caller's height winning", async () => {
    const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Tools, {}));

    const root = html.match(/<div[^>]*data-slot="toolbar"[^>]*>/)?.[0] ?? "";
    expect(root).toContain('role="toolbar"');
    expect(root).toContain('aria-orientation="horizontal"');
    expect(root).toContain('data-orientation="horizontal"');
    expect(root).toContain("flex w-full min-w-0 items-stretch overflow-hidden rounded-md border");
    expect(root).toContain("*:not-first:border-l");
    expect(root).toContain("*:data-[size^=icon]:aspect-square");
    expect(root).toContain("h-10");
    expect(root).not.toMatch(/[" ]h-9[" ]/);
    // Our buttons keep their slot and size, which the strip's child selectors read.
    const archive = html.match(/<button[^>]*aria-label="Archive"[^>]*>/)?.[0] ?? "";
    expect(archive).toContain('data-slot="button"');
    expect(archive).toContain('data-size="icon"');
    expect(archive).toContain('data-variant="outline"');
    expect(archive).toContain('aria-disabled="true"');
    const refresh = html.match(/<button[^>]*>Refresh/)?.[0] ?? "";
    expect(refresh).toContain('data-variant="ghost"');
    expect(refresh).toContain("hover:bg-muted");
  });

  it("leaves presses to the items and marks the disabled one for the kit's focus", () =>
    Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const play = yield* HtmlPlay.make(Tools, {});
          const archive = HtmlLocator.role("button", { name: "Archive" });
          yield* play.expect(archive).toHaveAttribute("data-disabled", "");
          yield* play.click(HtmlLocator.role("button", { name: "Refresh (0)" }));
          yield* play.expect(HtmlLocator.role("button", { name: "Refresh (1)" })).toExist();
        }),
      ).pipe(Effect.provide(TestHost.layer())),
    ));
});
