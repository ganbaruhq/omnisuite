import { Command, Component, Subscription, UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { HtmlPlay } from "@effect/ui/html/testing";
import { Locator, TestHost } from "@effect/ui/testing";
import {
  occurrenceIdOf,
  type CalendarEventInput,
  type CalendarNodeInput,
  type EditingInput,
  type EventProposal,
  type PreviewDescription,
} from "@omnisuite/calendar-core";
import { Effect, Layer, Queue, Schema, Stream } from "effect";
import { describe, expect, it } from "vite-plus/test";
import { declared, isObject, ResourceTimeline } from "./index.js";

// Keyboard editing as calendar-react's browser tests drive it, on the same fixture: the keys go
// to the focused event, and the application, receiving the timeline's events in its own update,
// applies each proposal to its events, or ignores it.

const resources: readonly CalendarNodeInput[] = [
  { id: "floor", title: "Floor", kind: "group" },
  { id: "r1", title: "Room 1", parentId: "floor" },
  { id: "r2", title: "Room 2", parentId: "floor" },
  { id: "r3", title: "Room 3", parentId: "floor" },
];
const standup: CalendarEventInput = {
  id: "standup",
  resourceIds: ["r1"],
  title: "Standup",
  start: "2026-10-26T09:10:00Z",
  end: "2026-10-26T10:20:00Z",
};
const review: CalendarEventInput = {
  id: "review",
  resourceIds: ["r2"],
  title: "Review",
  start: "2026-10-26T08:00:00Z",
  end: "2026-10-26T09:00:00Z",
};
const initial = [standup, review];
const half: EditingInput = { snap: "PT30M", startEditable: true, resourceEditable: true };
const resizable: EditingInput = { ...half, durationEditable: true };

/** The application's events, outside the calendar, as a query cache would hold them. */
const eventStore = (events: readonly CalendarEventInput[], accept: boolean) => {
  let current = events;
  const listeners = new Set<() => void>();
  const proposals: EventProposal[] = [];
  const errors: (readonly [rule: string, error: unknown])[] = [];
  return {
    proposals,
    errors,
    get: () => current,
    set: (next: readonly CalendarEventInput[]) => {
      current = next;
      for (const listener of listeners) listener();
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    answer: (proposal: EventProposal) => {
      proposals.push(proposal);
      if (!accept) return;
      current = current.map((event) => (event.id === proposal.eventId ? proposal.after : event));
      for (const listener of listeners) listener();
    },
  };
};
type EventStore = ReturnType<typeof eventStore>;

const HarnessMessage = UiSchema.TaggedEnum({
  Changed: {},
  GotProposal: { proposal: declared<EventProposal>(isObject) },
  GotRuleError: { rule: Schema.String, error: Schema.Unknown },
});

interface Extra {
  readonly describe?: (preview: PreviewDescription) => string;
}

const Harness = (store: EventStore, editing: EditingInput | undefined, extra: Extra = {}) => {
  // The application's answers, run by its update: the store applies a proposal or not, and
  // keeps the rule errors it was told of.
  const Answer = Command.make(
    "Answer",
    { args: { proposal: declared<EventProposal>(isObject) } },
    ({ proposal }) => Effect.sync(() => store.answer(proposal)).pipe(Effect.as(Component.noop)),
  );
  const Report = Command.make(
    "Report",
    { args: { rule: Schema.String, error: Schema.Unknown } },
    ({ rule, error }) =>
      Effect.sync(() => store.errors.push([rule, error])).pipe(Effect.as(Component.noop)),
  );
  return Html.component({ name: "Harness", model: Schema.Number, message: HarnessMessage }).make({
    init: () => 0,
    update: {
      Changed: ($) => $.model + 1,
      GotProposal: ($, { proposal }) => $.run(Answer.make({ proposal })),
      GotRuleError: ($, { rule, error }) => $.run(Report.make({ rule, error })),
    },
    subscriptions: () => [
      Subscription.make("events", [], () =>
        Stream.callback<typeof HarnessMessage.Type>((queue) =>
          Effect.acquireRelease(
            Effect.sync(() =>
              store.subscribe(() => Queue.offerUnsafe(queue, HarnessMessage.Changed())),
            ),
            (unsubscribe) => Effect.sync(unsubscribe),
          ),
        ),
      ),
    ],
    view: (h) =>
      ResourceTimeline(h, {
        props: {
          range: { start: "2026-10-26T00:00:00Z", end: "2026-10-27T00:00:00Z" },
          slotDuration: "PT1H",
          resources,
          events: store.get(),
          ...(editing && { editing }),
          ...extra,
        },
        onEmit: {
          Proposed: ({ proposal }) => HarnessMessage.GotProposal({ proposal }),
          RuleFailed: ({ rule, error }) => HarnessMessage.GotRuleError({ rule, error }),
        },
        view: (timeline) => {
          if (timeline.status === "invalid") return h.p(`Invalid: ${timeline.error.message}`);
          return timeline
            .root(h.div.attr("id", "calendar"))
            .children(
              timeline.editStatus(h.div),
              timeline
                .viewport(h.div)
                .children(
                  ...timeline.visibleRows.map((row) =>
                    row.kind === "group"
                      ? timeline
                          .groupRow(h.div.key(row.resource.id), row)
                          .children(row.resource.title)
                      : timeline
                          .resourceRow(h.div.key(row.resource.id), row)
                          .children(
                            h.span.children(row.resource.title),
                            timeline
                              .lane(h.div, row)
                              .children(
                                ...row.placements.map((placement) =>
                                  timeline
                                    .event(h.div.key(placement.occurrenceId), placement)
                                    .children(placement.event.title),
                                ),
                                timeline.preview(h.div, row),
                              ),
                          ),
                  ),
                ),
            );
        },
      }),
  });
};

/** The occurrences focused through the host, in order. */
let focused: string[] = [];
const recordingHost = Layer.succeed(Html.Host, {
  focus: (element) => {
    focused.push(
      (element as { readonly attrs?: Record<string, string | undefined> }).attrs?.[
        "data-occurrence-id"
      ] ?? "",
    );
  },
  blur: () => {},
  scrollIntoView: () => {},
  measure: () => ({ x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 }),
  select: () => {},
  requestSubmit: () => false,
  showPicker: () => false,
});

const played = <A, E>(effect: Effect.Effect<A, E, any>) => {
  focused = [];
  return Effect.runPromise(
    Effect.scoped(effect).pipe(
      Effect.provide(Layer.merge(TestHost.layer(), recordingHost)),
    ) as Effect.Effect<A, E>,
  );
};

const occurrence = (eventId: string, resourceId: string) =>
  Locator.attr("data-occurrence-id", occurrenceIdOf(eventId, resourceId));
const calendar = Locator.attr("data-timeline-root");
const preview = Locator.attr("data-timeline-preview");
const status = Locator.attr("data-timeline-status");
const inRow = (resourceId: string, locator: Locator.Locator) =>
  Locator.inside(Locator.attr("data-resource-id", resourceId), locator);

const mount = (store: EventStore, editing: EditingInput | null = half, extra: Extra = {}) =>
  HtmlPlay.make(Harness(store, editing ?? undefined, extra), {});

describe("ResourceTimeline keyboard editing", () => {
  it("moves by a snap step and a row, then proposes the destination on Enter", () => {
    const store = eventStore(initial, true);
    return played(
      Effect.gen(function* () {
        const play = yield* mount(store);
        const event = occurrence("standup", "r1");
        yield* play.expect(event).toHaveAttribute("tabindex", "0");

        yield* play.keydown(event, "Enter");
        yield* play.expect(calendar).toHaveAttribute("data-gesture", "keyboard");
        yield* play.expect(calendar).toHaveAttribute("data-operation", "move");
        yield* play.expect(event).toHaveAttribute("data-dragging", "true");

        yield* play.keydown(event, "ArrowRight");
        yield* play.keydown(event, "ArrowRight");
        // 09:10 + two half-hours is 10:10, which snaps to 10:00: 10/24 of the range.
        yield* play
          .expect(inRow("r1", preview))
          .toHaveAttribute("style", /inset-inline-start:41\.66/);

        yield* play.keydown(event, "ArrowDown");
        yield* play.expect(inRow("r2", preview)).toHaveAttribute("data-status", "allowed");
        yield* play.expect(inRow("r1", preview)).toBeAbsent();
        yield* play.expect(status).toHaveText(/^Move Standup to Room 2/);
        expect(store.proposals).toEqual([]);

        yield* play.keydown(event, "Enter");
        expect(store.proposals).toHaveLength(1);
        expect(store.proposals[0]).toMatchObject({
          sourceResourceId: "r1",
          targetResourceId: "r2",
          after: {
            resourceIds: ["r2"],
            start: "2026-10-26T10:00:00Z",
            end: "2026-10-26T11:10:00Z",
          },
        });
        yield* play.expect(calendar).toHaveAttribute("data-gesture", false);
        yield* play.expect(occurrence("standup", "r2")).toExist();
        // What was proposed is announced once the gesture has ended.
        yield* play.expect(status).toHaveText(/^Move Standup to Room 2, .*10:00.*to.*11:10/);
        // Focus follows the event to its rendering in the new row.
        expect(focused).toEqual([occurrenceIdOf("standup", "r2")]);
      }),
    );
  });

  it("keeps focus where it was when the application ignores the proposal", () => {
    const store = eventStore(initial, false);
    return played(
      Effect.gen(function* () {
        const play = yield* mount(store);
        const event = occurrence("standup", "r1");

        yield* play.keydown(event, "Enter");
        yield* play.keydown(event, "ArrowDown");
        yield* play.keydown(event, "Enter");

        expect(store.proposals).toHaveLength(1);
        yield* play.expect(event).toExist();
        expect(focused).toEqual([]);
      }),
    );
  });

  it("reports a rule that throws once per gesture, and rejects its destination", () => {
    const store = eventStore(initial, true);
    const failure = new Error("rule failed");
    return played(
      Effect.gen(function* () {
        const play = yield* mount(store, {
          ...half,
          allow: () => {
            throw failure;
          },
        });
        const event = occurrence("standup", "r1");

        yield* play.keydown(event, "Enter");
        yield* play.keydown(event, "ArrowRight");
        yield* play.keydown(event, "ArrowRight");
        yield* play.expect(preview).toHaveAttribute("data-rule", "allow");
        yield* play.expect(status).toHaveText(/a rule failed/);
        expect(store.errors).toEqual([["allow", failure]]);

        yield* play.keydown(event, "Enter");
        yield* play.expect(calendar).toHaveAttribute("data-cancel-reason", "rejected");
        expect(store.proposals).toEqual([]);
      }),
    );
  });

  it("describes the preview in the application's words", () => {
    const store = eventStore(initial, true);
    return played(
      Effect.gen(function* () {
        const play = yield* mount(store, half, {
          describe: (preview) =>
            `${preview.title} → ${preview.resourceTitles.join(", ")} (${preview.status})`,
        });
        const event = occurrence("standup", "r1");

        yield* play.keydown(event, "Enter");
        yield* play.keydown(event, "ArrowDown");
        yield* play.expect(status).toHaveText("Standup → Room 2 (allowed)");
        yield* play.expect(preview).toHaveAttribute("aria-label", "Standup → Room 2 (allowed)");
      }),
    );
  });

  it("reports invalid editing options as invalid input", () => {
    const store = eventStore(initial, true);
    return played(
      Effect.gen(function* () {
        const play = yield* mount(store, { snap: "nope" });
        yield* play.expect(Locator.text("Invalid:", { exact: false })).toExist();
        yield* play.expect(calendar).toBeAbsent();
      }),
    );
  });

  it("cancels on Escape, and goes no further up than the first resource row", () => {
    const store = eventStore(initial, true);
    return played(
      Effect.gen(function* () {
        const play = yield* mount(store);
        const event = occurrence("standup", "r1");

        yield* play.keydown(event, "Enter");
        yield* play.keydown(event, "ArrowLeft");
        yield* play.keydown(event, "ArrowUp");
        // The group heading is not a destination.
        yield* play.expect(inRow("r1", preview)).toExist();

        yield* play.keydown(event, "Escape");
        yield* play.expect(calendar).toHaveAttribute("data-gesture", false);
        yield* play.expect(calendar).toHaveAttribute("data-cancel-reason", "escape");
        yield* play.expect(preview).toBeAbsent();
        yield* play.expect(status).toHaveText("Move cancelled.");
        expect(store.proposals).toEqual([]);
      }),
    );
  });

  it("cancels when focus leaves the event", () => {
    const store = eventStore(initial, true);
    return played(
      Effect.gen(function* () {
        const play = yield* mount(store);
        const event = occurrence("standup", "r1");

        yield* play.keydown(event, "Enter");
        yield* play.keydown(event, "ArrowRight");
        yield* play.blur(event);

        yield* play.expect(calendar).toHaveAttribute("data-cancel-reason", "blur");
        expect(store.proposals).toEqual([]);
      }),
    );
  });

  it("does not move to a rejected destination", () => {
    const store = eventStore(initial, true);
    return played(
      Effect.gen(function* () {
        const play = yield* mount(store, { ...half, allow: () => false });
        const event = occurrence("standup", "r1");

        yield* play.keydown(event, "Enter");
        yield* play.keydown(event, "ArrowRight");
        yield* play.expect(preview).toHaveAttribute("data-status", "rejected");
        yield* play.expect(preview).toHaveAttribute("data-not-allowed", "true");
        yield* play.expect(status).toHaveText(/^Not allowed/);

        yield* play.keydown(event, "Enter");
        expect(store.proposals).toEqual([]);
        yield* play.expect(calendar).toHaveAttribute("data-cancel-reason", "rejected");
      }),
    );
  });

  it("proposes what the events are at confirmation when they change under the gesture", () => {
    const store = eventStore(initial, true);
    return played(
      Effect.gen(function* () {
        const play = yield* mount(store);
        const event = occurrence("standup", "r1");

        yield* play.keydown(event, "Enter");
        yield* play.keydown(event, "ArrowRight");
        store.set(
          store
            .get()
            .map((one) => (one.id === "standup" ? { ...one, data: { kind: "changed" } } : one)),
        );
        yield* play.expect(calendar).toHaveAttribute("data-gesture", "keyboard");
        yield* play.keydown(event, "Enter");

        expect(store.proposals[0]!.after.data).toEqual({ kind: "changed" });
      }),
    );
  });

  it("cancels when the event is removed or changed under the gesture", () => {
    const store = eventStore(initial, true);
    return played(
      Effect.gen(function* () {
        const play = yield* mount(store);
        yield* play.keydown(occurrence("standup", "r1"), "Enter");
        store.set(
          store.get().map((one) => (one.id === "standup" ? { ...one, title: "Renamed" } : one)),
        );
        yield* play.expect(calendar).toHaveAttribute("data-cancel-reason", "event-changed");

        yield* play.keydown(occurrence("standup", "r1"), "Enter");
        yield* play.expect(calendar).toHaveAttribute("data-gesture", "keyboard");
        store.set([review]);
        yield* play.expect(calendar).toHaveAttribute("data-cancel-reason", "event-removed");
      }),
    );
  });

  it("leaves the keys alone while the timeline is read-only", () => {
    const store = eventStore(initial, true);
    return played(
      Effect.gen(function* () {
        const play = yield* mount(store, null);
        yield* play.expect(occurrence("standup", "r1")).toHaveAttribute("tabindex", false);
        yield* play.expect(occurrence("standup", "r1")).toHaveAttribute("aria-keyshortcuts", false);
      }),
    );
  });

  describe("resizing", () => {
    it("resizes the end edge with Shift and the arrows, then proposes it on Enter", () => {
      const store = eventStore(initial, true);
      return played(
        Effect.gen(function* () {
          const play = yield* mount(store, resizable);
          const event = occurrence("standup", "r1");

          yield* play.keydown(event, "ArrowRight", { shift: true });
          yield* play.expect(calendar).toHaveAttribute("data-gesture", "keyboard");
          yield* play.expect(calendar).toHaveAttribute("data-operation", "resize");
          yield* play
            .expect(status)
            .toHaveText(/^Resize the end of Standup on Room 1, .*9:10.*to.*11:00/);
          // The edge goes on moving without the modifier; a resize keeps its row.
          yield* play.keydown(event, "ArrowRight");
          yield* play.keydown(event, "ArrowLeft");
          yield* play.keydown(event, "ArrowDown");
          yield* play.expect(inRow("r1", preview)).toExist();

          yield* play.keydown(event, "Enter");
          expect(store.proposals).toHaveLength(1);
          expect(store.proposals[0]).toMatchObject({
            operation: "resize",
            edge: "end",
            after: { start: "2026-10-26T09:10:00Z", end: "2026-10-26T11:00:00Z" },
          });
        }),
      );
    });

    it("resizes the start edge with Alt and the arrows, and confirms on Space", () => {
      const store = eventStore(initial, true);
      return played(
        Effect.gen(function* () {
          const play = yield* mount(store, resizable);
          const event = occurrence("standup", "r1");

          yield* play.keydown(event, "ArrowLeft", { alt: true });
          yield* play.keydown(event, " ");

          expect(store.proposals[0]).toMatchObject({
            edge: "start",
            after: { start: "2026-10-26T08:30:00Z", end: "2026-10-26T10:20:00Z" },
          });
        }),
      );
    });

    it("cancels a resize on Escape with its own words", () => {
      const store = eventStore(initial, true);
      return played(
        Effect.gen(function* () {
          const play = yield* mount(store, resizable);
          const event = occurrence("standup", "r1");

          yield* play.keydown(event, "ArrowRight", { shift: true });
          yield* play.keydown(event, "Escape");
          yield* play.expect(calendar).toHaveAttribute("data-cancel-reason", "escape");
          yield* play.expect(status).toHaveText("Resize cancelled.");
          yield* play.expect(preview).toBeAbsent();
          expect(store.proposals).toEqual([]);
        }),
      );
    });

    it("does not resize without a modifier, with Ctrl, at a clipped edge, or with resizing off", () => {
      const before: CalendarEventInput = {
        id: "before",
        resourceIds: ["r3"],
        title: "Before",
        start: "2026-10-25T20:00:00Z",
        end: "2026-10-26T04:00:00Z",
      };
      const store = eventStore([standup, before], true);
      return played(
        Effect.gen(function* () {
          const play = yield* mount(store, resizable);

          yield* play.keydown(occurrence("standup", "r1"), "ArrowRight");
          yield* play.expectIgnored();
          yield* play.keydown(occurrence("standup", "r1"), "ArrowRight", {
            shift: true,
            ctrl: true,
          });
          yield* play.expectIgnored();
          yield* play.keydown(occurrence("before", "r3"), "ArrowLeft", { alt: true });
          yield* play.expectIgnored();
          yield* play.expect(calendar).toHaveAttribute("data-gesture", false);

          yield* play.keydown(occurrence("before", "r3"), "ArrowRight", { shift: true });
          yield* play.expect(calendar).toHaveAttribute("data-gesture", "keyboard");
        }),
      );
    });

    it("names the keys each event answers to", () => {
      const before: CalendarEventInput = {
        id: "before",
        resourceIds: ["r3"],
        title: "Before",
        start: "2026-10-25T20:00:00Z",
        end: "2026-10-26T04:00:00Z",
      };
      const store = eventStore([standup, before], true);
      return played(
        Effect.gen(function* () {
          const play = yield* mount(store, resizable);
          yield* play
            .expect(occurrence("standup", "r1"))
            .toHaveAttribute(
              "aria-keyshortcuts",
              "Enter Space Alt+ArrowLeft Alt+ArrowRight Shift+ArrowLeft Shift+ArrowRight",
            );
          yield* play
            .expect(occurrence("before", "r3"))
            .toHaveAttribute("aria-keyshortcuts", "Enter Space Shift+ArrowLeft Shift+ArrowRight");
        }),
      );
    });

    it("resizes an event that can only be resized, and leaves Enter alone", () => {
      const store = eventStore(initial, true);
      return played(
        Effect.gen(function* () {
          const play = yield* mount(store, { snap: "PT30M", durationEditable: true });
          const event = occurrence("standup", "r1");
          yield* play.expect(event).toHaveAttribute("data-movable", false);
          yield* play.expect(event).toHaveAttribute("data-editable", "");

          yield* play.keydown(event, "Enter");
          yield* play.expectIgnored();
          yield* play.expect(calendar).toHaveAttribute("data-gesture", false);
          yield* play.keydown(event, "ArrowRight", { shift: true });
          yield* play.keydown(event, "Enter");
          expect(store.proposals).toHaveLength(1);
        }),
      );
    });
  });
});
