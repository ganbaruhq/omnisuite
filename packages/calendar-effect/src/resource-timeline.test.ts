import { UiSchema } from "@effect/ui";
import { Html, HtmlServer } from "@effect/ui/html";
import { HtmlLocator, HtmlPlay } from "@effect/ui/html/testing";
import { Locator, TestHost } from "@effect/ui/testing";
import {
  decodeTimeline,
  timelineWindowOf,
  type CalendarEventInput,
  type CalendarNodeInput,
  type TimelineWindow,
  type WindowCoverageByKey,
  type WindowObserver,
} from "@omnisuite/calendar-core";
import { Effect, Schema } from "effect";
import { describe, expect, it } from "vite-plus/test";
import {
  ResourceTimeline,
  type ResourceTimelineProps,
  type WindowLoadingOptions,
} from "./index.js";

const resources: readonly CalendarNodeInput[] = [
  { id: "floor", title: "First floor", kind: "group" },
  { id: "room-101", title: "Room 101", parentId: "floor" },
  { id: "room-102", title: "Room 102", parentId: "floor" },
];
const events: readonly CalendarEventInput[] = [
  {
    id: "stay",
    title: "Stay",
    resourceIds: ["room-101"],
    start: "2026-10-25T18:00Z",
    end: "2026-10-26T12:00Z",
  },
  {
    id: "clean",
    title: "Clean",
    resourceIds: ["room-101"],
    start: "2026-10-26T09:00Z",
    end: "2026-10-26T15:00Z",
  },
];

const rangeOf = (day: number) => ({
  start: `2026-10-${day}T00:00Z`,
  end: `2026-10-${day + 1}T00:00Z`,
});
const windowOfDay = (day: number): TimelineWindow =>
  timelineWindowOf(
    Effect.runSync(
      decodeTimeline({ range: rangeOf(day), slotDuration: "PT6H", resources, events }),
    ),
  );

// The calendar's parts, drawn the way an application would draw them.
const Board = <Msg>(h: Html.H<Msg>, props: ResourceTimelineProps) =>
  ResourceTimeline(h, {
    props,
    view: (timeline) => {
      if (timeline.status === "invalid") return h.p(`Invalid: ${timeline.error.message}`);
      return timeline
        .root(h.div)
        .children(
          timeline
            .windowStatus(h.div)
            ?.children(
              `Window ${timeline.loading?.state.status}`,
              timeline.loading?.state.status === "failed"
                ? timeline.retry(h.button)?.children("Retry")
                : undefined,
            ),
          timeline
            .viewport(h.div)
            .children(
              timeline
                .axis(h.div)
                .children(
                  ...timeline.timeline.slots.map((slot) =>
                    timeline.axisSlot(h.div, slot).children(slot.start.toString()),
                  ),
                ),
              ...timeline.visibleRows.map((row) =>
                row.kind === "group"
                  ? timeline
                      .groupRow(h.div.key(row.resource.id), row)
                      .children(timeline.disclosure(h.button, row), row.resource.title)
                  : timeline
                      .resourceRow(h.div.key(row.resource.id), row)
                      .children(
                        timeline.disclosure(h.button, row),
                        h.span.children(row.resource.title),
                        timeline
                          .lane(h.div, row)
                          .children(
                            ...row.placements.map((placement) =>
                              timeline
                                .event(h.div.key(placement.occurrenceId), placement)
                                .children(placement.event.title),
                            ),
                          ),
                      ),
              ),
            ),
        );
    },
  });

const Static = (props: ResourceTimelineProps) =>
  Html.component({ name: "Static", model: Schema.Null, message: Schema.Never }).make({
    init: () => null,
    update: ($) => $.model,
    view: (h) => Board(h, props),
  });

const played = <A, E>(effect: Effect.Effect<A, E, any>) =>
  Effect.runPromise(
    Effect.scoped(effect).pipe(Effect.provide(TestHost.layer())) as Effect.Effect<A, E>,
  );

describe("ResourceTimeline", () => {
  it("draws the rows, the time axis and each occurrence in its share of the range", async () => {
    const { html } = await Effect.runPromise(
      HtmlServer.renderToHtml(
        Static({ range: rangeOf(26), slotDuration: "PT6H", resources, events }),
        {},
      ),
    );

    expect(html).toContain('data-timeline-root style="--timeline-span:4"');
    expect(html.match(/data-timeline-slot /g)).toHaveLength(4);
    expect(html).toContain(
      'data-timeline-slot style="position:absolute;inset-block:0;inset-inline-start:25%;width:25%"',
    );
    expect(html).toContain('data-group-id="floor" data-kind="group" data-depth="0"');
    expect(html).toContain('aria-label="Collapse First floor"');
    expect(html).toContain('aria-description="Group, level 1"');
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('aria-label="Room 101 events"');
    expect(html).toContain('style="position:relative;--timeline-lane-count:2"');
    expect(html).toMatch(
      /data-event-id="stay"[^>]*data-starts-before="true"[^>]*style="position:absolute;inset-inline-start:0%;width:50%;inset-block-start:0%;inset-block-end:50%"/,
    );
    expect(html).toMatch(
      /data-event-id="clean"[^>]*data-lane="1"[^>]*style="position:absolute;inset-inline-start:37.5%;width:25%;inset-block-start:50%;inset-block-end:0%"/,
    );
    expect(html).not.toContain("data-ends-after");
    expect(html).not.toContain("data-timeline-window-status");
  });

  it("returns invalid input as an error instead of drawing it", async () => {
    const { html } = await Effect.runPromise(
      HtmlServer.renderToHtml(
        Static({ range: rangeOf(26), slotDuration: "nope", resources, events }),
        {},
      ),
    );

    expect(html).toContain("Invalid:");
    expect(html).not.toContain("data-timeline-root");
  });

  it("lets a consumer's style win over the part's", async () => {
    const Styled = Html.component({
      name: "Styled",
      model: Schema.Null,
      message: Schema.Never,
    }).make({
      init: () => null,
      update: ($) => $.model,
      view: (h) =>
        ResourceTimeline(h, {
          props: { range: rangeOf(26), slotDuration: "PT6H", resources, events },
          view: (timeline) =>
            timeline.status === "ready"
              ? timeline.viewport(h.div.style({ overflow: "hidden", height: "20rem" }))
              : h.p(),
        }),
    });
    const { html } = await Effect.runPromise(HtmlServer.renderToHtml(Styled, {}));

    expect(html).toContain('style="overflow:auto;overflow:hidden;height:20rem"');
  });

  it("collapses and expands a parent from its disclosure", () =>
    played(
      Effect.gen(function* () {
        const play = yield* HtmlPlay.make(
          Static({ range: rangeOf(26), slotDuration: "PT6H", resources, events }),
          {},
        );
        yield* play.expect(Locator.text("Room 101")).toExist();

        yield* play.click(HtmlLocator.role("button", { name: "Collapse First floor" }));
        yield* play.expect(Locator.text("Room 101")).toBeAbsent();
        yield* play
          .expect(HtmlLocator.role("button", { name: "Expand First floor" }))
          .toHaveAttribute("aria-expanded", "false");

        yield* play.click(HtmlLocator.role("button", { name: "Expand First floor" }));
        yield* play.expect(Locator.text("Room 101")).toExist();
      }),
    ));
});

const HostMessage = UiSchema.TaggedEnum({
  ClickedNext: {},
  ClickedPrevious: {},
  ClickedFail: {},
  ClickedRender: {},
});

/** Moves the timeline day by day and reports a failure of the shown window on request. */
const LoadingHost = (onLoadWindow: WindowObserver) =>
  Html.component({
    name: "LoadingHost",
    model: Schema.Struct({
      day: Schema.Number,
      failed: Schema.Array(Schema.Number),
      renders: Schema.Number,
    }),
    message: HostMessage,
  }).make({
    init: () => ({ day: 26, failed: [], renders: 0 }),
    update: {
      ClickedNext: ($) => $.evolve({ day: (day) => day + 1 }),
      ClickedPrevious: ($) => $.evolve({ day: (day) => day - 1 }),
      ClickedFail: ($) => $.evolve({ failed: (failed) => [...failed, $.model.day] }),
      ClickedRender: ($) => $.evolve({ renders: (renders) => renders + 1 }),
    },
    view: (h, model) => {
      const coverage: WindowCoverageByKey = Object.fromEntries(
        model.failed.map((day) => [windowOfDay(day).key, { status: "failed" as const }]),
      );
      const loading: WindowLoadingOptions = { coverage, onLoadWindow };
      return h.div(
        h.button.on("click", HostMessage.ClickedPrevious()).children("Previous"),
        h.button.on("click", HostMessage.ClickedNext()).children("Next"),
        h.button.on("click", HostMessage.ClickedFail()).children("Fail"),
        h.button.on("click", HostMessage.ClickedRender()).children(`Render ${model.renders}`),
        Board(h, { range: rangeOf(model.day), slotDuration: "PT6H", resources, events, loading }),
      );
    },
  });

/** Records every signal and every end of an observation, by the window's start. */
const recorder = () => {
  const log: string[] = [];
  const onLoadWindow: WindowObserver = (window, { retry }) => {
    const day = window.range.start.slice(0, 10);
    log.push(`start ${day}${retry ? " retry" : ""}`);
    return () => log.push(`stop ${day}`);
  };
  return { log, onLoadWindow };
};

const click = (name: string) => HtmlLocator.role("button", { name });

describe("ResourceTimeline window loading", () => {
  it("signals the shown window once, and ends it when the window changes", () => {
    const { log, onLoadWindow } = recorder();
    return played(
      Effect.gen(function* () {
        const play = yield* HtmlPlay.make(LoadingHost(onLoadWindow), {});
        yield* play.expect(Locator.text("Window unknown")).toExist();
        expect(log).toEqual(["start 2026-10-26"]);

        yield* play.click(click("Render 0"));
        yield* play.expect(Locator.text("Render 1")).toExist();
        expect(log).toEqual(["start 2026-10-26"]);

        yield* play.click(click("Next"));
        expect(log).toEqual(["start 2026-10-26", "stop 2026-10-26", "start 2026-10-27"]);
      }),
    ).then(() => expect(log.at(-1)).toBe("stop 2026-10-27"));
  });

  it("reports a failed window and signals it again, as a retry, only when asked", () => {
    const { log, onLoadWindow } = recorder();
    return played(
      Effect.gen(function* () {
        const play = yield* HtmlPlay.make(LoadingHost(onLoadWindow), {});
        yield* play.click(click("Fail"));
        yield* play.expect(Locator.text("Window failed")).toExist();
        yield* play
          .expect(Locator.attr("data-timeline-window-status"))
          .toHaveAttribute("aria-live", "assertive");
        expect(log).toEqual(["start 2026-10-26"]);

        yield* play.click(click("Retry"));
        yield* play.click(click("Render 0"));
        expect(log).toEqual(["start 2026-10-26", "stop 2026-10-26", "start 2026-10-26 retry"]);

        // Coming back to a window that was once retried is not a retry.
        yield* play.click(click("Next"));
        yield* play.click(click("Previous"));
        yield* play.expect(Locator.text("Window failed")).toExist();
        expect(log.slice(3)).toEqual([
          "stop 2026-10-26",
          "start 2026-10-27",
          "stop 2026-10-27",
          "start 2026-10-26",
        ]);
      }),
    );
  });

  it("fails, and leaves the tree, when the application's observer throws", () =>
    played(
      Effect.gen(function* () {
        const play = yield* HtmlPlay.make(
          LoadingHost((window) => {
            if (window.range.start.startsWith("2026-10-27")) throw new Error("observer failed");
          }),
          {},
        );
        yield* play.expect(Locator.attr("data-timeline-root")).toExist();

        yield* play.click(click("Next"));
        yield* play.expect(Locator.attr("data-timeline-root")).toBeAbsent();
        yield* play.expect(click("Next")).toExist();
      }),
    ));
});
