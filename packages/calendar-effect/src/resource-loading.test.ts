import { Subscription, UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { HtmlLocator, HtmlPlay } from "@effect/ui/html/testing";
import { Locator, TestHost } from "@effect/ui/testing";
import {
  resourceScopeOf,
  type CalendarNodeInput,
  type ResourceCoverageByScope,
  type ResourceObserver,
} from "@omnisuite/calendar-core";
import { Effect, Queue, Schema, Stream } from "effect";
import { describe, expect, it } from "vite-plus/test";
import { ResourceTimeline, type ResourceLoadingOptions } from "./index.js";

// Resource loading as calendar-react's `resourceLoading` does it: the children of a parent with
// `lazyChildren` are asked for when it is first expanded, each scope with its own state. The
// application owns the resources and the coverage, here in a store outside the calendar.

const parents: readonly CalendarNodeInput[] = [
  { id: "hostel", title: "Hostel", kind: "group", lazyChildren: true },
  { id: "annex", title: "Annex", kind: "group", lazyChildren: true },
];
const hostelRooms: readonly CalendarNodeInput[] = [
  { id: "room-1", title: "Room 1", parentId: "hostel" },
  { id: "room-2", title: "Room 2", parentId: "hostel" },
];
const hostel = resourceScopeOf("hostel").key;
const annex = resourceScopeOf("annex").key;

/** The application's side: what it has loaded, and what it knows about each scope. */
const resourceStore = () => {
  let state: {
    resources: readonly CalendarNodeInput[];
    coverage: ResourceCoverageByScope<string>;
  } = { resources: parents, coverage: {} };
  const listeners = new Set<() => void>();
  const log: string[] = [];
  const onLoad: ResourceObserver = (request, { retry }) => {
    const name = request.scope.parentId ?? "list";
    const cursor = request.cursor === undefined ? "" : ` @${String(request.cursor)}`;
    log.push(`start ${name}${cursor}${retry ? " retry" : ""}`);
    return () => log.push(`stop ${name}`);
  };
  return {
    log,
    onLoad,
    get: () => state,
    set: (next: Partial<typeof state>) => {
      state = { ...state, ...next };
      for (const listener of listeners) listener();
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};
type ResourceStore = ReturnType<typeof resourceStore>;

const HarnessMessage = UiSchema.TaggedEnum({ Changed: {} });

const Harness = (store: ResourceStore) =>
  Html.component({ name: "Harness", model: Schema.Number, message: HarnessMessage }).make({
    init: () => 0,
    update: { Changed: ($) => $.model + 1 },
    subscriptions: () => [
      Subscription.make("resources", [], () =>
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
    view: (h) => {
      const { resources, coverage } = store.get();
      const resourceLoading: ResourceLoadingOptions = { coverage, onLoad: store.onLoad };
      return ResourceTimeline(h, {
        props: {
          range: { start: "2026-10-26T00:00:00Z", end: "2026-10-27T00:00:00Z" },
          slotDuration: "PT6H",
          resources,
          events: [],
          resourceLoading,
        },
        view: (timeline) => {
          if (timeline.status === "invalid") return h.p(`Invalid: ${timeline.error.message}`);
          const loading = timeline.resourceLoading!;
          return timeline.root(h.div).children(
            timeline.viewport(h.div).children(
              ...timeline.visibleRows.flatMap((row) => {
                const branch = loading.branch(row.resource.id);
                const expanded = !timeline.collapsedIds.has(row.resource.id);
                return [
                  timeline
                    .groupRow(h.div.key(row.resource.id), row as never)
                    .children(timeline.disclosure(h.button, row), row.resource.title),
                  expanded && row.resource.lazyChildren
                    ? timeline
                        .scopeStatus(h.div.key(`${row.resource.id}-status`), branch)
                        ?.children(
                          `${row.resource.title} ${branch.state.status}`,
                          branch.state.status === "failed"
                            ? timeline
                                .retryResources(h.button, branch)
                                ?.children(`Retry ${row.resource.title}`)
                            : undefined,
                          branch.state.status === "loaded" && branch.hasMore
                            ? timeline
                                .loadMoreResources(h.button, branch)
                                ?.children(`More ${row.resource.title}`)
                            : undefined,
                        )
                    : undefined,
                ];
              }),
              timeline.listEnd(h.div),
            ),
          );
        },
      });
    },
  });

const played = <A, E>(effect: Effect.Effect<A, E, any>) =>
  Effect.runPromise(
    Effect.scoped(effect).pipe(Effect.provide(TestHost.layer())) as Effect.Effect<A, E>,
  );

const button = (name: string) => HtmlLocator.role("button", { name });
const scopeStatus = (parentId: string) => Locator.attr("data-parent-id", parentId);

describe("ResourceTimeline resource loading", () => {
  it("asks for a parent's children once when it is first expanded, and stops when it collapses", () => {
    const store = resourceStore();
    return played(
      Effect.gen(function* () {
        const play = yield* HtmlPlay.make(Harness(store), {});
        // A parent whose children load starts collapsed, and nothing is asked for it.
        yield* play.expect(button("Expand Hostel")).toHaveAttribute("aria-expanded", "false");
        expect(store.log).toEqual([]);

        yield* play.click(button("Expand Hostel"));
        yield* play.expect(Locator.text("Hostel unknown")).toExist();
        expect(store.log).toEqual(["start hostel"]);

        store.set({ coverage: { [hostel]: { status: "pending" } } });
        yield* play.expect(Locator.text("Hostel pending")).toExist();
        store.set({
          resources: [...parents, ...hostelRooms],
          coverage: { [hostel]: { status: "loaded" } },
        });
        yield* play.expect(Locator.text("Room 1")).toExist();
        yield* play.expect(Locator.text("Hostel loaded")).toExist();
        expect(store.log).toEqual(["start hostel"]);

        yield* play.click(button("Collapse Hostel"));
        yield* play.expect(Locator.text("Room 1")).toBeAbsent();
        expect(store.log).toEqual(["start hostel", "stop hostel"]);

        // Its children are known now, so expanding it again asks for nothing.
        yield* play.click(button("Expand Hostel"));
        yield* play.expect(Locator.text("Room 1")).toExist();
        expect(store.log).toEqual(["start hostel", "stop hostel"]);
      }),
    ).then(() => expect(store.log).toEqual(["start hostel", "stop hostel"]));
  });

  it("keeps each parent's state apart, and announces a failure assertively", () => {
    const store = resourceStore();
    return played(
      Effect.gen(function* () {
        const play = yield* HtmlPlay.make(Harness(store), {});
        yield* play.click(button("Expand Hostel"));
        yield* play.click(button("Expand Annex"));
        expect(store.log).toEqual(["start hostel", "start annex"]);

        store.set({
          coverage: {
            [hostel]: { status: "pending" },
            [annex]: { status: "failed", error: "offline", cursor: 0 },
          },
        });
        yield* play.expect(Locator.text("Hostel pending")).toExist();
        yield* play.expect(Locator.text("Annex failed")).toExist();
        yield* play
          .expect(scopeStatus("annex"))
          .toHaveAttributes({ role: "status", "aria-live": "assertive", "data-status": "failed" });
        yield* play
          .expect(scopeStatus("hostel"))
          .toHaveAttributes({ "aria-live": "polite", "data-status": "pending" });
      }),
    );
  });

  it("asks for a failed page again, as a retry, only when asked", () => {
    const store = resourceStore();
    return played(
      Effect.gen(function* () {
        const play = yield* HtmlPlay.make(Harness(store), {});
        yield* play.click(button("Expand Annex"));
        store.set({ coverage: { [annex]: { status: "failed", error: "offline", cursor: 0 } } });
        yield* play.expect(Locator.text("Annex failed")).toExist();
        expect(store.log).toEqual(["start annex"]);

        yield* play.click(button("Retry Annex"));
        expect(store.log).toEqual(["start annex", "stop annex", "start annex @0 retry"]);

        store.set({ coverage: { [annex]: { status: "pending", cursor: 0 } } });
        yield* play.expect(Locator.text("Annex pending")).toExist();
        expect(store.log).toHaveLength(3);
      }),
    );
  });

  it("asks for a further page of a branch when the viewer asks for more", () => {
    const store = resourceStore();
    return played(
      Effect.gen(function* () {
        const play = yield* HtmlPlay.make(Harness(store), {});
        yield* play.click(button("Expand Hostel"));
        store.set({
          resources: [...parents, hostelRooms[0]!],
          coverage: { [hostel]: { status: "loaded", hasMore: true, cursor: 1 } },
        });
        yield* play.expect(scopeStatus("hostel")).toHaveAttribute("data-has-more", "true");
        expect(store.log).toEqual(["start hostel"]);

        yield* play.click(button("More Hostel"));
        expect(store.log).toEqual(["start hostel", "stop hostel", "start hostel @1"]);
      }),
    );
  });

  it("asks afresh for a scope the application stops reporting", () => {
    const store = resourceStore();
    return played(
      Effect.gen(function* () {
        const play = yield* HtmlPlay.make(Harness(store), {});
        yield* play.click(button("Expand Hostel"));
        store.set({ coverage: { [hostel]: { status: "pending" } } });
        yield* play.expect(Locator.text("Hostel pending")).toExist();

        // A cancelled request is not a failure: the application leaves it out.
        store.set({ coverage: {} });
        yield* play.expect(Locator.text("Hostel unknown")).toExist();
        expect(store.log).toEqual(["start hostel", "stop hostel", "start hostel"]);
      }),
    );
  });

  it("marks the end of the list with the top level's state", () => {
    const store = resourceStore();
    return played(
      Effect.gen(function* () {
        const play = yield* HtmlPlay.make(Harness(store), {});
        yield* play
          .expect(Locator.attr("data-timeline-list-end"))
          .toHaveAttributes({ "data-status": "unknown", "data-has-more": "true" });

        store.set({ coverage: { [resourceScopeOf(null).key]: { status: "loaded" } } });
        yield* play
          .expect(Locator.attr("data-timeline-list-end"))
          .toHaveAttribute("data-has-more", false);
      }),
    );
  });
});
