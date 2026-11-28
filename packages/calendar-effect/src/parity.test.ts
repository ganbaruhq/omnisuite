import { Html, HtmlServer } from "@effect/ui/html";
import type { CalendarEventInput, CalendarNodeInput } from "@omnisuite/calendar-core";
import { ResourceTimeline as ReactTimeline, useResourceTimeline } from "@omnisuite/calendar-react";
import { Effect, Schema } from "effect";
import { createElement as e, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { ResourceTimeline, type ResourceTimelineProps } from "./index.js";

// Overlapping events, an event cut by both ends of the range, a group, a nested resource and a
// slot the end of the range cuts short; and, in Europe/Berlin, the hour the clock repeats.
const resources: readonly CalendarNodeInput[] = [
  { id: "floor", title: "First floor", kind: "group" },
  { id: "room-101", title: "Room 101", parentId: "floor" },
  { id: "bed-a", title: "Bed A", parentId: "room-101" },
  { id: "room-102", title: "Room 102", parentId: "floor" },
  { id: "lobby", title: "Lobby" },
];
const events: readonly CalendarEventInput[] = [
  {
    id: "stay",
    title: "Stay",
    resourceIds: ["room-101", "lobby"],
    start: "2026-10-24T18:00Z",
    end: "2026-10-25T05:00Z",
  },
  {
    id: "clean",
    title: "Clean",
    resourceIds: ["room-101"],
    start: "2026-10-25T00:30Z",
    end: "2026-10-25T03:00Z",
  },
  {
    id: "long",
    title: "Long",
    resourceIds: ["bed-a"],
    start: "2026-10-20T00:00Z",
    end: "2026-10-30T00:00Z",
  },
  {
    id: "visit",
    title: "Visit",
    resourceIds: ["room-102"],
    start: "2026-10-25T01:15Z",
    end: "2026-10-25T01:45Z",
  },
];
const cases: Record<string, ResourceTimelineProps> = {
  UTC: {
    range: { start: "2026-10-25T00:00Z", end: "2026-10-25T05:30Z" },
    slotDuration: "PT1H",
    resources,
    events,
  },
  "Europe/Berlin": {
    range: { start: "2026-10-25T00:00Z", end: "2026-10-25T03:00Z" },
    slotDuration: "PT30M",
    timeZone: "Europe/Berlin",
    resources,
    events,
  },
};

const slotText = (start: { toString(): string }) => start.toString();

/** calendar-react's parts, drawn into the same tree as {@link EffectBoard}. */
function ReactBoard(props: ResourceTimelineProps): ReactNode {
  // The schema's optional fields admit `undefined`, which the React input leaves out.
  const timeline = useResourceTimeline(props as Parameters<typeof useResourceTimeline>[0]);
  if (timeline.status !== "ready") return null;
  const T = ReactTimeline;
  return e(
    T.Root,
    { timeline: timeline.timeline },
    e(
      T.Viewport,
      null,
      e(
        T.Axis,
        null,
        timeline.timeline.slots.map((slot) =>
          e(T.AxisSlot, { key: slot.offset, slot }, slotText(slot.start)),
        ),
      ),
      timeline.visibleRows.map((row) => {
        const disclosure = e(T.Disclosure, {
          row,
          expanded: !timeline.collapsedIds.has(row.resource.id),
          onExpandedChange: () => {},
        });
        return row.kind === "group"
          ? e(T.GroupRow, { key: row.resource.id, row }, disclosure, row.resource.title)
          : e(
              T.ResourceRow,
              { key: row.resource.id, row },
              disclosure,
              e("span", null, row.resource.title),
              e(
                T.Lane,
                null,
                row.placements.map((placement) =>
                  e(T.Event, { key: placement.occurrenceId, placement }, placement.event.title),
                ),
              ),
            );
      }),
    ),
  );
}

/** This package's parts, drawn into the same tree as {@link ReactBoard}. */
const EffectBoard = (props: ResourceTimelineProps) =>
  Html.component({ name: "EffectBoard", model: Schema.Null, message: Schema.Never }).make({
    init: () => null,
    update: ($) => $.model,
    view: (h) =>
      ResourceTimeline(h, {
        props,
        view: (timeline) =>
          timeline.status !== "ready"
            ? h.p()
            : timeline
                .root(h.div)
                .children(
                  timeline
                    .viewport(h.div)
                    .children(
                      timeline
                        .axis(h.div)
                        .children(
                          ...timeline.timeline.slots.map((slot) =>
                            timeline.axisSlot(h.div, slot).children(slotText(slot.start)),
                          ),
                        ),
                      ...timeline.visibleRows.map((row) =>
                        row.kind === "group"
                          ? timeline
                              .groupRow(h.div, row)
                              .children(timeline.disclosure(h.button, row), row.resource.title)
                          : timeline
                              .resourceRow(h.div, row)
                              .children(
                                timeline.disclosure(h.button, row),
                                h.span.children(row.resource.title),
                                timeline
                                  .lane(h.div, row)
                                  .children(
                                    ...row.placements.map((placement) =>
                                      timeline
                                        .event(h.div, placement)
                                        .children(placement.event.title),
                                    ),
                                  ),
                              ),
                      ),
                    ),
                ),
      }),
  });

const unescape = (text: string) =>
  text.replaceAll("&quot;", '"').replaceAll("&#x27;", "'").replaceAll("&amp;", "&");

/**
 * The markup as a list of tags and text, each tag with its attributes sorted, an empty value
 * written as no value, and its style as sorted declarations. Effect UI's hydration markers go.
 */
const normalized = (html: string): readonly string[] =>
  html
    .replaceAll(/<!--.*?-->/g, "")
    .split(/(<[^>]+>)/)
    .filter((token) => token !== "")
    .map((token) => {
      const tag = /^<(\/?[a-z]+)(.*?)\/?>$/s.exec(token);
      if (!tag) return `text ${unescape(token)}`;
      const attributes = [...tag[2]!.matchAll(/([a-z-]+)(?:="([^"]*)")?/g)].map(
        ([, name, value = ""]) => {
          const text = unescape(value);
          return name === "style"
            ? `style=${text.split(";").filter(Boolean).sort().join(";")}`
            : `${name}=${text}`;
        },
      );
      return [tag[1], ...attributes.sort()].join(" ");
    });

describe("parity with calendar-react", () => {
  for (const [name, props] of Object.entries(cases))
    it(`draws the same resources, events and time marks as calendar-react, in ${name}`, async () => {
      const react = normalized(renderToStaticMarkup(e(ReactBoard, props)));
      const { html } = await Effect.runPromise(HtmlServer.renderToHtml(EffectBoard(props), {}));
      const effect = normalized(html);

      expect(react.filter((token) => token.includes("data-timeline-event")).length).toBeGreaterThan(
        3,
      );
      expect(effect).toEqual(react);
    });
});
