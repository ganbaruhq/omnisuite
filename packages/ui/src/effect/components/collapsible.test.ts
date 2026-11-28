import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { HtmlLocator, HtmlPlay, HtmlScene } from "@effect/ui/html/testing";
import { TestHost } from "@effect/ui/testing";
import { Effect, Schema } from "effect";
import { describe, it } from "vite-plus/test";
import { Collapsible } from "@omnisuite/ui/effect/components/collapsible";

const Message = UiSchema.TaggedEnum({ Toggled: { open: Schema.Boolean } });

const Section = Html.component({
  name: "CollapsibleSection",
  model: Schema.Struct({ open: Schema.Boolean }),
  message: Message,
}).make({
  init: () => ({ open: false }),
  update: { Toggled: ($, { open }) => $.evolve({ open: () => open }) },
  view: (h, model) =>
    Collapsible(h, {
      props: { open: model.open },
      onEmit: {
        Toggled: ({ open }) => Message.Toggled({ open }),
        Settled: () => undefined,
      },
      view: (section) =>
        section
          .root(h.div)
          .children(
            section.trigger(h.button).children("Workspace pages"),
            section
              .panel(h.div)
              ?.attrs({ role: "region", "aria-label": "Pages" })
              .children("Collections"),
          ),
    }),
});

const trigger = HtmlLocator.role("button", { name: "Workspace pages" });
const panel = HtmlLocator.role("region", { name: "Pages" });

describe("Effect Collapsible", () => {
  it("maps the kit's Toggled to the consumer's open, which it feeds back", () =>
    Effect.gen(function* () {
      const scene = yield* HtmlScene.make(Section, {});
      scene
        .expect(panel)
        .toBeAbsent()
        .childEmit(Collapsible.kit, { _tag: "Toggled", open: true, reason: "trigger-press" })
        .expect(panel)
        .toHaveAttribute("data-slot", "collapsible-content")
        .expect(panel)
        .toHaveAttribute("data-open", "");
    }).pipe(Effect.scoped, Effect.runSync));

  it("opens and closes from its trigger, with React's slots and the kit's ARIA", () =>
    Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const play = yield* HtmlPlay.make(Section, {});
          yield* play.expect(trigger).toHaveAttribute("data-slot", "collapsible-trigger");
          yield* play.expect(trigger).toHaveAttribute("aria-expanded", "false");
          yield* play.click(trigger);
          yield* play.expect(trigger).toHaveAttribute("aria-expanded", "true");
          yield* play.expect(panel).toExist();
          yield* play.click(trigger);
          yield* play.expect(trigger).toHaveAttribute("aria-expanded", "false");
          yield* play.expect(panel).toBeAbsent();
        }),
      ).pipe(Effect.provide(TestHost.layer())),
    ));
});
