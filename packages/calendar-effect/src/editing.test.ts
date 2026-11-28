import { Component } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { HtmlScene } from "@effect/ui/html/testing";
import { Locator } from "@effect/ui/testing";
import type {
  CalendarEventInput,
  CalendarNodeInput,
  EditingInput,
  EventProposal,
} from "@omnisuite/calendar-core";
import { Effect } from "effect";
import { describe, expect, it } from "vite-plus/test";
import { NotifyProposal, NotifyRuleError } from "./editor.js";
import { PointerFact, TimelinePointer } from "./pointer.js";
import { ResourceTimeline, type ResourceTimelineProps } from "./resource-timeline.js";

const resources: readonly CalendarNodeInput[] = [
  { id: "room-101", title: "Room 101" },
  { id: "room-102", title: "Room 102" },
];
const emma: CalendarEventInput = {
  id: "emma",
  title: "Emma",
  resourceIds: ["room-101"],
  start: "2026-10-26T09:00Z",
  end: "2026-10-26T10:00Z",
};
const liam: CalendarEventInput = {
  id: "liam",
  title: "Liam",
  resourceIds: ["room-102"],
  start: "2026-10-26T12:00Z",
  end: "2026-10-26T14:00Z",
  overlap: false,
};
const editing: EditingInput = {
  snap: "PT30M",
  startEditable: true,
  resourceEditable: true,
  durationEditable: true,
};
const onProposal = () => {};
const onRuleError = () => {};

const propsOf = (overrides: Partial<ResourceTimelineProps> = {}): ResourceTimelineProps => ({
  range: { start: "2026-10-26T00:00Z", end: "2026-10-27T00:00Z" },
  slotDuration: "PT1H",
  resources,
  events: [emma, liam],
  editing,
  onProposal,
  onRuleError,
  ...overrides,
});

// The parts drawn the way an application draws them.
const sceneOf = (props: ResourceTimelineProps) =>
  HtmlScene.make(ResourceTimeline, props, {
    elements: Html,
    view: (timeline, h) => {
      if (timeline.status === "invalid") return h.p(`Invalid: ${timeline.error.message}`);
      return timeline
        .root(h.div)
        .children(
          timeline.editStatus(h.div),
          timeline
            .viewport(h.div)
            .children(
              ...timeline.visibleRows.map((row) =>
                row.kind === "resource"
                  ? timeline
                      .resourceRow(h.div.key(row.resource.id), row)
                      .children(
                        timeline
                          .lane(h.div, row)
                          .children(
                            timeline.preview(h.div.key("preview"), row),
                            ...row.placements.map((placement) =>
                              timeline
                                .event(h.div.key(placement.occurrenceId), placement)
                                .children(
                                  timeline.resizeHandle(h.div.key("start"), placement, "start"),
                                  placement.event.title,
                                  timeline.resizeHandle(h.div.key("end"), placement, "end"),
                                ),
                            ),
                          ),
                      )
                  : h.div.key(row.resource.id),
              ),
            ),
        );
    },
  });

const played = <A, E>(effect: Effect.Effect<A, E, any>) =>
  Effect.runPromise(Effect.scoped(effect) as Effect.Effect<A, E>);

const pointer = TimelinePointer({ span: 24, source: null });
const following = (source: string) => TimelinePointer({ span: 24, source });
const root = Locator.attr("data-timeline-root");
const preview = Locator.attr("data-timeline-preview");
const status = Locator.attr("data-timeline-status");
const eventNamed = (id: string): Locator.Locator => ({
  description: `event ${id}`,
  all: (node) =>
    Locator.attr("data-timeline-event")
      .all(node)
      .filter(({ attrs }) => attrs?.["data-event-id"] === id),
});
const press = (fields: Partial<Parameters<typeof PointerFact.Pressed>[0]> = {}) =>
  PointerFact.Pressed({
    operation: "move",
    eventId: "emma",
    resourceId: "room-101",
    slot: 9.25,
    targetResourceId: "room-101",
    ...fields,
  });

const proposalsOf = (
  pending: ReadonlyArray<{ readonly command: { readonly name: string; readonly args: unknown } }>,
) =>
  pending
    .filter(({ command }) => command.name === "NotifyProposal")
    .map(({ command }) => (command.args as { proposal: EventProposal }).proposal);

describe("ResourceTimeline editing", () => {
  it("marks what can be edited and draws a handle on each resizable edge", () =>
    played(
      Effect.gen(function* () {
        const scene = yield* sceneOf(propsOf());
        scene
          .expectMount(pointer)
          .expect(eventNamed("emma"))
          .toHaveAttributes({
            "data-editable": "",
            "data-movable": "true",
            "data-resizable": "true",
            tabindex: "0",
          })
          .expect(Locator.attr("data-timeline-resize-handle"))
          .toHaveCount(4)
          .expect(preview)
          .toBeAbsent()
          .expect(status)
          .toHaveText("");
      }),
    ));

  it("is read-only, with no mount and no handles, without editing", () =>
    played(
      Effect.gen(function* () {
        const scene = yield* sceneOf(propsOf({ editing: undefined }));
        scene
          .expect(eventNamed("emma"))
          .toHaveAttribute("data-editable", false)
          .expect(Locator.attr("data-timeline-resize-handle"))
          .toHaveCount(0);
      }),
    ));

  it("previews a move, snapped, in the target row and proposes it on release", () =>
    played(
      Effect.gen(function* () {
        const scene = yield* sceneOf(propsOf());
        scene
          .expectMount(pointer)
          .mounted(TimelinePointer, press())
          .expectMount(following("room-101"))
          .expect(root)
          .toHaveAttributes({ "data-gesture": "pointer", "data-operation": "move" })
          .expect(eventNamed("emma"))
          .toHaveAttribute("data-dragging", "true")
          .expect(eventNamed("emma"))
          .toHaveAttribute("style", /opacity:0;pointer-events:none$/)
          .expect(preview)
          .toHaveAttribute("data-status", "unchanged")
          // 1.3 slots later is 10:18, which snaps to 10:30.
          .mounted(
            TimelinePointer,
            PointerFact.Moved({ slot: 10.55, targetResourceId: "room-102" }),
          )
          .expect(Locator.inside(Locator.attr("data-resource-id", "room-102"), preview))
          .toExist()
          .expect(preview)
          .toHaveAttributes({
            "data-status": "allowed",
            "aria-label": "Move Emma to Room 102, Oct 26, 2026, 10:30 AM to Oct 26, 2026, 11:30 AM",
          })
          .expect(status)
          .toHaveText("Move Emma to Room 102, Oct 26, 2026, 10:30 AM to Oct 26, 2026, 11:30 AM")
          .expectNone();

        // Liam forbids sharing time, so this destination is rejected.
        scene
          .mounted(
            TimelinePointer,
            PointerFact.Moved({ slot: 12.25, targetResourceId: "room-102" }),
          )
          .expect(preview)
          .toHaveAttributes({ "data-status": "rejected", "data-rule": "overlap" })
          .mounted(
            TimelinePointer,
            PointerFact.Moved({ slot: 10.55, targetResourceId: "room-102" }),
          )
          .mounted(TimelinePointer, PointerFact.Released({ canceled: false }))
          .expectMount(pointer)
          .check(({ pending }) => {
            const [proposal] = proposalsOf(pending);
            expect(proposalsOf(pending)).toHaveLength(1);
            expect(proposal).toMatchObject({
              operation: "move",
              eventId: "emma",
              sourceResourceId: "room-101",
              targetResourceId: "room-102",
              after: {
                start: "2026-10-26T10:30:00Z",
                end: "2026-10-26T11:30:00Z",
                resourceIds: ["room-102"],
              },
            });
          })
          .resolve(NotifyProposal, Component.noop)
          .expect(root)
          .toHaveAttribute("data-gesture", false)
          .expect(preview)
          .toBeAbsent()
          .expect(status)
          .toHaveText("Move Emma to Room 102, Oct 26, 2026, 10:30 AM to Oct 26, 2026, 11:30 AM");
      }),
    ));

  it("proposes nothing for a rejected release, and says why", () =>
    played(
      Effect.gen(function* () {
        const scene = yield* sceneOf(propsOf());
        scene
          .expectMount(pointer)
          .mounted(TimelinePointer, press())
          .expectMount(following("room-101"))
          .mounted(
            TimelinePointer,
            PointerFact.Moved({ slot: 12.25, targetResourceId: "room-102" }),
          )
          .mounted(TimelinePointer, PointerFact.Released({ canceled: false }))
          .expectMount(pointer)
          .expectNone()
          .expect(root)
          .toHaveAttribute("data-cancel-reason", "rejected")
          .expect(status)
          .toHaveText("Move cancelled: that destination is not allowed.");
      }),
    ));

  it("cancels on Escape, and when released over no resource", () =>
    played(
      Effect.gen(function* () {
        const scene = yield* sceneOf(propsOf());
        scene
          .expectMount(pointer)
          .mounted(TimelinePointer, press())
          .expectMount(following("room-101"))
          .mounted(TimelinePointer, PointerFact.Moved({ slot: 11, targetResourceId: "room-102" }))
          .mounted(TimelinePointer, PointerFact.Released({ canceled: true }))
          .expectMount(pointer)
          .expectNone()
          .expect(root)
          .toHaveAttribute("data-cancel-reason", "escape")
          .expect(status)
          .toHaveText("Move cancelled.")
          .expect(eventNamed("emma"))
          .toHaveAttribute("data-dragging", false);

        scene
          .mounted(TimelinePointer, press())
          .expectMount(following("room-101"))
          .expect(root)
          .toHaveAttribute("data-cancel-reason", false)
          .mounted(TimelinePointer, PointerFact.Moved({ slot: 11, targetResourceId: null }))
          .expect(preview)
          .toBeAbsent()
          .expect(status)
          .toHaveText("Moving Emma: not over a resource.")
          .mounted(TimelinePointer, PointerFact.Released({ canceled: false }))
          .expectMount(pointer)
          .expectNone()
          .expect(root)
          .toHaveAttribute("data-cancel-reason", "invalid-target");
      }),
    ));

  it("resizes an edge along the time axis, wherever the pointer is", () =>
    played(
      Effect.gen(function* () {
        const scene = yield* sceneOf(propsOf());
        scene
          .expectMount(pointer)
          .mounted(TimelinePointer, press({ operation: "resize", edge: "end", slot: 10 }))
          .expectMount(following("room-101"))
          .expect(root)
          .toHaveAttribute("data-operation", "resize")
          .mounted(TimelinePointer, PointerFact.Moved({ slot: 11.6, targetResourceId: null }))
          .expect(preview)
          .toHaveAttribute(
            "aria-label",
            "Resize the end of Emma on Room 101, Oct 26, 2026, 9:00 AM to Oct 26, 2026, 11:30 AM",
          )
          .mounted(TimelinePointer, PointerFact.Released({ canceled: false }))
          .expectMount(pointer)
          .check(({ pending }) =>
            expect(proposalsOf(pending)).toMatchObject([
              {
                operation: "resize",
                edge: "end",
                after: { start: "2026-10-26T09:00:00Z", end: "2026-10-26T11:30:00Z" },
              },
            ]),
          )
          .resolve(NotifyProposal, Component.noop);
      }),
    ));

  it("says nothing changed for a release where the gesture began", () =>
    played(
      Effect.gen(function* () {
        const scene = yield* sceneOf(propsOf());
        scene
          .expectMount(pointer)
          .mounted(TimelinePointer, press())
          .expectMount(following("room-101"))
          .mounted(TimelinePointer, PointerFact.Released({ canceled: false }))
          .expectMount(pointer)
          .expectNone()
          .expect(status)
          .toHaveText("Emma was not moved.");
      }),
    ));

  it("cancels the gesture when the dragged event changes under it", () =>
    played(
      Effect.gen(function* () {
        const scene = yield* sceneOf(propsOf());
        scene
          .expectMount(pointer)
          .mounted(TimelinePointer, press())
          .expectMount(following("room-101"))
          .props(propsOf({ events: [{ ...emma, title: "Emma B." }, liam] }));
        scene
          .subscription(
            scene.subscriptions.find((key) => key.startsWith("edit:"))!,
            {
              _tag: "Reconciled",
            },
          )
          .expectMount(pointer)
          .expect(root)
          .toHaveAttribute("data-cancel-reason", "event-changed")
          .expect(status)
          .toHaveText("Move cancelled: the event changed.");
      }),
    ));

  it("reports a rule that throws once per gesture, as a rejection", () =>
    played(
      Effect.gen(function* () {
        const error = new Error("rule failed");
        const scene = yield* sceneOf(
          propsOf({
            editing: {
              ...editing,
              allow: () => {
                throw error;
              },
            },
          }),
        );
        scene
          .expectMount(pointer)
          .mounted(TimelinePointer, press())
          .expectMount(following("room-101"))
          .mounted(TimelinePointer, PointerFact.Moved({ slot: 11, targetResourceId: "room-102" }))
          .check(({ pending }) => {
            expect(pending.map(({ command }) => command.name)).toEqual(["NotifyRuleError"]);
            expect(pending[0]!.command.args).toMatchObject({ error, rule: "allow" });
          })
          .resolve(NotifyRuleError, Component.noop)
          .expect(preview)
          .toHaveAttributes({ "data-status": "rejected", "data-rule": "allow" })
          .mounted(TimelinePointer, PointerFact.Moved({ slot: 12, targetResourceId: "room-102" }))
          .expectNone();
      }),
    ));
});
