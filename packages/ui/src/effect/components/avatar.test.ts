import { Html, HtmlServer } from "@effect/ui/html";
import { HtmlLocator, HtmlPlay, TestImages } from "@effect/ui/html/testing";
import { Locator, TestHost } from "@effect/ui/testing";
import { Effect, Layer, Schema } from "effect";
import { describe, expect, it } from "vite-plus/test";
import {
  Avatar,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
  AvatarPlaceholder,
} from "@omnisuite/ui/effect/components/avatar";

const picture = { src: "/ada.png" };

const Team = Html.component({
  name: "AvatarTeam",
  model: Schema.Null,
  message: Schema.Never,
}).make({
  init: () => null,
  update: ($) => $.model,
  view: (h) =>
    AvatarGroup(h).children(
      Avatar(h, {
        key: "ada",
        props: picture,
        view: (avatar) =>
          avatar
            .root(h.span, "lg")
            .class("size-12")
            .children(
              avatar.image(h.img.attr("alt", "Ada Lovelace")),
              avatar.fallback(h.span, "purple")?.children("AL"),
              AvatarBadge(h),
            ),
      }),
      Avatar(h, {
        key: "unknown",
        view: (avatar) =>
          avatar
            .root(h.span)
            .attr("aria-label", "Unknown user")
            .children(avatar.fallback(h.span)?.children(AvatarPlaceholder(h))),
      }),
      AvatarGroupCount(h).children("+2"),
    ),
});

const tag = (html: string, slot: string) =>
  html.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? "";

describe("Effect Avatar", () => {
  it("draws React's avatar, initials, badge and group, the caller's size winning", async () => {
    const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Team, {}));

    const root = tag(html, "avatar");
    expect(root).toContain('data-size="lg"');
    expect(root).toContain("group/avatar relative flex");
    expect(root).toContain("size-12");
    expect(root).not.toMatch(/[" ]size-8[" ]/);
    const fallback = tag(html, "avatar-fallback");
    expect(fallback).toContain('data-color="purple"');
    expect(fallback).toContain("bg-avatar-purple text-avatar-purple-foreground");
    expect(html).toContain(">AL</span>");
    // The server can't load the picture, so it draws the fallback.
    expect(html).not.toContain("<img");
    expect(tag(html, "avatar-badge")).toContain("ring-2 ring-background");
    expect(tag(html, "avatar-group")).toContain("-space-x-2");
    expect(tag(html, "avatar-group-count")).toContain("bg-muted");
    // Without initials, React's grey figure.
    expect(html).toContain('data-color="gray"');
    expect(html).toMatch(
      /<svg viewBox="0 0 80 80"[^>]*class="size-full overflow-hidden rounded-full"/,
    );
    expect(html).toContain('fill="var(--color-avatar-placeholder)"');
  });

  it("swaps the initials for the styled picture once it loads", () =>
    Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const play = yield* HtmlPlay.make(Team, {});
          const image = HtmlLocator.role("img", { name: "Ada Lovelace" });
          yield* play.expect(Locator.text("AL")).toExist();
          yield* play.expect(image).toBeAbsent();
          yield* TestImages.load(picture);
          yield* TestHost.settle;
          yield* play.expect(image).toHaveAttribute("data-slot", "avatar-image");
          yield* play.expect(image).toHaveAttribute("src", "/ada.png");
          yield* play.expect(Locator.text("AL")).toBeAbsent();
        }),
      ).pipe(Effect.provide(Layer.merge(TestHost.layer(), TestImages.layer))),
    ));
});
