import { Command, Component, Subscription, UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import {
  timelineViewResult,
  type EditingInput,
  type EventProposal,
  type TimelineInputIssue,
  type TimelinePreset,
  type TimelineRow,
  type TimelineView,
} from "@omnisuite/calendar-core";
import { declared, isObject, ResourceTimeline } from "@omnisuite/calendar-effect";
import { Button } from "@omnisuite/ui/effect/components/button";
import { cn } from "cn";
import { Effect, Queue, Schema, Stream } from "effect";
import {
  adjacentAnchor,
  branchEnds,
  presets,
  rangeOf,
  scopeText,
  slotLabel,
  timeOf,
  timeZones,
  views,
  windowText,
} from "./board";
import type { SampleBoard, StayKind } from "@omnisuite/calendar-sample-data/sample-timeline";
import type { ResourceQueries } from "@omnisuite/calendar-sample-data/resource-queries";
import type { WindowQueries } from "@omnisuite/calendar-sample-data/window-queries";

// The React example's "Front desk" board, drawn with @omnisuite/calendar-effect: the same
// toolbar, rows, axis and events, with the same classes. With `queries` it loads events window by
// window as the viewer moves through time; with `resourceQueries` it loads the rooms a page or a
// branch at a time; and with `editing` its events move and resize, by pointer or keyboard, and
// the board decides on each proposal in its own update.

export type SampleEvent = SampleBoard["events"][number];
export type SampleProposal = EventProposal<{ kind: StayKind }>;

const slotWidth: Record<TimelinePreset, string> = {
  hour: "min-w-[calc(var(--timeline-span)*4.5rem)] flex-1",
  day: "min-w-[calc(var(--timeline-span)*7rem)] flex-1",
  week: "min-w-[calc(var(--timeline-span)*7rem)] flex-1",
  month: "min-w-[calc(var(--timeline-span)*7rem)] flex-1",
};
const rowWidth = "flex w-max min-w-full";
const resourceColumn = "sticky start-0 z-10 w-52 shrink-0 border-e bg-card";
const groupClass = "flex items-center gap-1";
// A strip along an event's edge; the calendar draws it only where the edge can be resized.
const resizeHandle = "w-2 shrink-0 cursor-ew-resize hover:bg-primary/30";

const Message = UiSchema.TaggedEnum({
  PickedPreset: { preset: Schema.Literals(presets) },
  PickedTimeZone: { timeZone: Schema.String },
  ClickedPrevious: {},
  ClickedNext: {},
  ChangedQueries: {},
  Proposed: { proposal: declared<SampleProposal>(isObject) },
});

/** What the board emits: each proposal the calendar made, once the board has decided on it. */
export const FrontDeskEvents = UiSchema.TaggedEnum({
  Proposed: { proposal: declared<SampleProposal>(isObject) },
});

const viewOf = (model: {
  readonly preset: TimelinePreset;
  readonly anchor: string;
  readonly timeZone: string;
}) =>
  timelineViewResult({
    preset: model.preset,
    anchor: model.anchor,
    timeZone: model.timeZone,
    ...views[model.preset],
  });

const moved = (
  model: { readonly preset: TimelinePreset; readonly anchor: string; readonly timeZone: string },
  direction: -1 | 1,
) => {
  const view = viewOf(model);
  return view._tag === "Success"
    ? adjacentAnchor(view.success, model.preset, direction)
    : model.anchor;
};

/**
 * Re-renders the page whenever the application's queries publish a new snapshot. It reads the
 * snapshot again once it listens, as `useSyncExternalStore` does, since the timeline's first
 * signal can publish before the page has subscribed.
 */
const watchQueries = (name: string, queries: { subscribe(listener: () => void): () => void }) =>
  Subscription.make(name, [], () =>
    Stream.callback<typeof Message.Type>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const changed = () => Queue.offerUnsafe(queue, Message.ChangedQueries());
          const unsubscribe = queries.subscribe(changed);
          changed();
          return unsubscribe;
        }),
        (unsubscribe) => Effect.sync(unsubscribe),
      ),
    ),
  );

/**
 * Accepts a proposal: the calendar changes nothing itself, so the board updates the event in the
 * application's query cache, which publishes new events to the page.
 */
const AcceptProposal = Command.make(
  "AcceptProposal",
  {
    args: {
      queries: declared<WindowQueries<SampleEvent>>(isObject),
      proposal: declared<SampleProposal>(isObject),
    },
  },
  ({ queries, proposal }) =>
    Effect.sync(() => queries.update(proposal.after)).pipe(Effect.as(Component.noop)),
);

const problems = <Msg>(h: Html.H<Msg>, issues: readonly TimelineInputIssue[]) =>
  h.div
    .attr("role", "alert")
    .class("px-6")
    .children(
      h.ul
        .class("list-disc ps-5")
        .children(
          ...issues.map((issue) =>
            h.li.children(h.code.children(issue.path.join(".")), `: ${issue.message}`),
          ),
        ),
    );

const Board = <Msg>(
  h: Html.H<Msg>,
  options: {
    readonly view: TimelineView;
    readonly preset: TimelinePreset;
    readonly input: SampleBoard;
    readonly queries: WindowQueries<SampleEvent> | undefined;
    readonly resourceQueries: ResourceQueries | undefined;
    readonly editing: EditingInput<{ kind: StayKind }> | undefined;
    /** The message for a proposal the calendar emits. */
    readonly proposed: (proposal: SampleProposal) => Msg;
  },
) => {
  const { view, preset, input, queries, resourceQueries, editing, proposed } = options;
  const loaded = queries?.getSnapshot();
  const loadedResources = resourceQueries?.getSnapshot();
  const axisWidth = slotWidth[preset];
  return ResourceTimeline(h, {
    props: {
      ...view,
      resources: loadedResources ? loadedResources.resources : input.resources,
      events: loaded ? loaded.events : input.events,
      loading: queries && loaded && { coverage: loaded.coverage, onLoadWindow: queries.observe },
      resourceLoading: resourceQueries &&
        loadedResources && { coverage: loadedResources.coverage, onLoad: resourceQueries.observe },
      ...(editing && { editing }),
    },
    onEmit: {
      Proposed: ({ proposal }) => proposed(proposal),
      // The sample rules do not throw; a rejected destination is shown on the preview.
      RuleFailed: () => undefined,
    },
    view: (timeline) => {
      if (timeline.status === "invalid") return problems(h, timeline.error.issues);
      const { collapsedIds, loading, resourceLoading, visibleRows } = timeline;
      const ends = branchEnds(visibleRows, collapsedIds);
      const branchStatus = (parent: TimelineRow) => {
        const branch = resourceLoading!.branch(parent.resource.id);
        const text = scopeText(branch, parent.resource.title);
        const title = parent.resource.title;
        const action =
          text?.action &&
          (text.action.kind === "retry" ? timeline.retryResources : timeline.loadMoreResources)(
            Button(h, { size: "sm", variant: "outline" }).attr(
              "aria-label",
              `${text.action.label} ${title}`,
            ),
            branch,
          );
        return timeline
          .scopeStatus(
            h.div
              .key(`${parent.resource.id}-status`)
              .class(cn(rowWidth, "border-b text-xs empty:hidden")),
            branch,
          )
          ?.children(
            text
              ? [
                  h.div
                    .class(cn(resourceColumn, "flex items-center gap-2 py-1.5 pe-3"))
                    .style({ paddingInlineStart: `${1.75 + (parent.depth + 1) * 0.75}rem` })
                    .children(
                      h.span
                        .class(
                          branch.state.status === "failed"
                            ? "text-destructive"
                            : "text-muted-foreground",
                        )
                        .children(text.message),
                      action?.children(text.action!.verb),
                    ),
                  h.div.class(axisWidth),
                ]
              : undefined,
          );
      };
      const list = resourceLoading?.list;
      const listText =
        list?.state.status === "failed"
          ? undefined
          : list?.state.status === "pending" || list?.state.status === "unknown"
            ? visibleRows.length > 0
              ? "Loading more rooms…"
              : "Loading rooms…"
            : list?.state.status === "loaded-empty"
              ? "There are no rooms to show."
              : undefined;
      const listStatus =
        list &&
        timeline
          .scopeStatus(h.div.class(cn(rowWidth, "border-b text-xs empty:hidden")), list)
          ?.children(
            list.state.status === "failed"
              ? h.div
                  .class(cn(resourceColumn, "flex items-center gap-3 px-3 py-1.5"))
                  .children(
                    h.span
                      .class("text-destructive")
                      .children("Could not load more rooms. What is loaded is still shown."),
                    timeline
                      .retryResources(Button(h, { size: "sm", variant: "outline" }), list)
                      ?.children("Retry"),
                  )
              : listText
                ? h.div
                    .class(cn(resourceColumn, "px-3 py-1.5 text-muted-foreground"))
                    .children(listText)
                : undefined,
          );
      const row = (row: TimelineRow) => {
        const expanded = !collapsedIds.has(row.resource.id);
        const disclosure = timeline.disclosure(
          h.button.class(
            "flex size-6 shrink-0 items-center justify-center hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring",
          ),
          row,
        );
        const label = h.div
          .class(cn(resourceColumn, "flex items-center gap-1 py-2 pe-3 text-sm font-medium"))
          .style({ paddingInlineStart: `${0.5 + row.depth * 0.75}rem` })
          .children(
            disclosure
              ? disclosure.children(
                  h.span.attr("aria-hidden", "true").children(expanded ? "▾" : "▸"),
                )
              : h.span.attr("aria-hidden", "true").class("w-6 shrink-0"),
            h.span
              .class("truncate")
              .attrs({
                role: row.kind === "group" ? "heading" : undefined,
                "aria-level": row.kind === "group" ? String(row.depth + 1) : undefined,
              })
              .children(row.resource.title),
          );
        if (row.kind === "group")
          return timeline
            .groupRow(h.div.key(row.resource.id).class(cn(rowWidth, "border-b bg-muted/40")), row)
            .children(label, h.div.class(axisWidth));
        return timeline
          .resourceRow(
            h.div.key(row.resource.id).class(cn(rowWidth, "border-b last:border-b-0")),
            row,
          )
          .children(
            label,
            timeline
              .lane(
                h.div.class(cn(axisWidth, "min-h-[calc(var(--timeline-lane-count)*3.5rem)]")),
                row,
              )
              .children(
                ...row.placements.map((placement) => {
                  const { event } = placement;
                  const kind = (event.data as { readonly kind?: StayKind } | undefined)?.kind;
                  return timeline
                    .event(
                      h.div
                        .key(placement.occurrenceId)
                        .attr(
                          "aria-label",
                          `${event.title}, ${timeOf(event.start, timeline.timeline.timeZone)} – ${timeOf(event.end, timeline.timeline.timeZone)}`,
                        )
                        .class(
                          cn(
                            "my-2 flex min-w-0 items-center overflow-hidden border-s-4 px-2 text-xs",
                            "data-movable:cursor-grab data-editable:focus-visible:outline-2 data-editable:focus-visible:outline-ring",
                            kind === "maintenance"
                              ? "border-destructive bg-destructive/10"
                              : "border-primary bg-primary/10",
                            "data-starts-before:border-s-0 data-ends-after:border-e-0",
                          ),
                        ),
                      placement,
                    )
                    .children(
                      timeline.resizeHandle(
                        h.div.key("start").class(resizeHandle),
                        placement,
                        "start",
                      ),
                      h.span.key("title").class("truncate font-medium").children(event.title),
                      timeline.resizeHandle(h.div.key("end").class(resizeHandle), placement, "end"),
                    );
                }),
                timeline
                  .preview(
                    h.div
                      .key("preview")
                      .class(
                        "my-2 flex min-w-0 items-center overflow-hidden border-2 border-dashed border-primary bg-primary/20 px-2 text-xs data-not-allowed:cursor-not-allowed data-not-allowed:border-destructive data-not-allowed:bg-destructive/20",
                      ),
                    row,
                  )
                  ?.children(
                    h.span
                      .class("truncate font-medium")
                      .children(timeline.editor?.preview?.placement?.event.title ?? ""),
                  ),
              ),
          );
      };

      const status = loading?.state.status;
      const windowStatus = timeline
        .windowStatus(h.div.class(cn(rowWidth, "border-b text-xs data-[status=loaded]:border-b-0")))
        ?.children(
          status === "loaded" || status === undefined
            ? undefined
            : [
                h.div
                  .class(cn(resourceColumn, "px-3 py-1.5 text-muted-foreground"))
                  .children("Events"),
                h.div
                  .class(cn(axisWidth, "flex items-center gap-3 px-3 py-1.5"))
                  .children(
                    ...(status === "failed"
                      ? [
                          h.span
                            .class("text-destructive")
                            .children(
                              "Could not load events for this window. What is already loaded is still shown.",
                            ),
                          timeline
                            .retry(Button(h, { size: "sm", variant: "outline" }))
                            ?.children("Retry"),
                        ]
                      : [h.span.class("text-muted-foreground").children(windowText[status])]),
                  ),
              ],
        );

      return h.div.class("px-0 pb-6").children(
        timeline.editStatus(h.div.class("sr-only")),
        timeline.root(h.div).children(
          timeline
            .viewport(
              h.div
                .attrs({
                  "aria-label": "Room timeline",
                  "aria-busy": status === "pending" ? "true" : undefined,
                })
                .class("max-h-[60vh] border-y focus-visible:outline-2 focus-visible:outline-ring"),
            )
            .children(
              h.div.class(cn(rowWidth, "border-b bg-muted/40 text-xs")).children(
                h.div.class(cn(resourceColumn, "bg-muted px-3 py-2 font-medium")).children("Room"),
                timeline.axis(h.div.class(cn(axisWidth, "h-12"))).children(
                  ...timeline.timeline.slots.map((slot, index) => {
                    const label = slotLabel(preset, slot, timeline.timeline.slots[index - 1]);
                    return timeline
                      .axisSlot(
                        h.div
                          .key(slot.start.toString())
                          .class(
                            "flex flex-col justify-center overflow-hidden border-e px-2 whitespace-nowrap data-repeated:bg-muted",
                          ),
                        slot,
                      )
                      .children(
                        h.span.class("text-muted-foreground").children(label.top),
                        h.strong.children(label.bottom),
                      );
                  }),
                ),
              ),
              windowStatus,
              ...visibleRows.flatMap((shown, index) => [
                row(shown),
                ...(resourceLoading ? (ends.get(index) ?? []).map(branchStatus) : []),
              ]),
              // The end of the list asks for the next page when it comes into view.
              timeline.listEnd(h.div.class("h-px")),
              listStatus,
            ),
        ),
      );
    },
  });
};

/**
 * A resource timeline with a toolbar for the scale and the time zone, and, with `queries`, for
 * moving to the window before or after. It is read-only unless `editing` is given; with
 * `resourceQueries` the rooms load a page or a branch at a time.
 */
export const FrontDesk = Html.component({
  name: "FrontDesk",
  props: Schema.Struct({
    /** The resources and events to show. With `queries`, the events are what has loaded. */
    input: declared<SampleBoard>((u) => typeof u === "object" && u !== null),
    queries: Schema.optional(declared<WindowQueries<SampleEvent>>((u) => typeof u === "object")),
    /** Loads the rooms a page or a branch at a time; `input.resources` are then not used. */
    resourceQueries: Schema.optional(declared<ResourceQueries>((u) => typeof u === "object")),
    anchor: Schema.optional(Schema.String),
    title: Schema.optional(Schema.String),
    /** Lets the events move and resize. Without it the board is read-only. */
    editing: Schema.optional(
      declared<EditingInput<{ kind: StayKind }>>((u) => typeof u === "object" && u !== null),
    ),
    /**
     * Whether the board accepts proposals, by updating the event in `queries`. Defaults to true;
     * without `queries` there is nothing to update, so proposals are only reported.
     */
    acceptProposals: Schema.optional(Schema.Boolean),
  }),
  model: Schema.Struct({
    anchor: Schema.String,
    preset: Schema.Literals(presets),
    timeZone: Schema.String,
    revision: Schema.Number,
  }),
  message: Message,
  events: FrontDeskEvents,
}).make({
  init: ({ props }) => ({
    anchor: props.anchor ?? "2026-10-26T12:00Z",
    preset: "day",
    timeZone: "UTC",
    revision: 0,
  }),
  update: {
    PickedPreset: ($, { preset }) => $.evolve({ preset }),
    PickedTimeZone: ($, { timeZone }) => $.evolve({ timeZone }),
    ClickedPrevious: ($) => $.evolve({ anchor: moved($.model, -1) }),
    ClickedNext: ($) => $.evolve({ anchor: moved($.model, 1) }),
    ChangedQueries: ($) => $.evolve({ revision: (revision) => revision + 1 }),
    Proposed: ($, { proposal }) => {
      const reported = $.emit(FrontDeskEvents.Proposed({ proposal }));
      return $.props.acceptProposals !== false && $.props.queries
        ? reported.run(AcceptProposal.make({ queries: $.props.queries, proposal }))
        : reported;
    },
  },
  subscriptions: ({ props }) => [
    ...(props.queries ? [watchQueries("queries", props.queries)] : []),
    ...(props.resourceQueries ? [watchQueries("resource-queries", props.resourceQueries)] : []),
  ],
  view: (h, model) => {
    const props = h.props;
    const view = viewOf(model);
    const toggle = (pressed: boolean, onPress: typeof Message.Type) =>
      Button(h, { size: "sm", variant: pressed ? "default" : "outline", onPress }).attr(
        "aria-pressed",
        String(pressed),
      );
    const title = props.title ?? "Front desk";
    const titleId = `${title.toLowerCase().replaceAll(/\W+/g, "-")}-title`;
    return h.section
      .attr("aria-labelledby", titleId)
      .class("mx-auto flex max-w-6xl flex-col gap-4 rounded-xl border bg-card py-6")
      .children(
        h.div
          .class("flex flex-col gap-1 px-6")
          .children(
            h.h2.attr("id", titleId).class("font-semibold leading-none").children(title),
            h.p
              .class("text-sm text-muted-foreground")
              .children(
                view._tag === "Success" ? rangeOf(view.success) : "The timeline cannot be shown.",
              ),
          ),
        h.div.class("flex flex-wrap gap-3 px-6").children(
          h.div
            .attrs({ role: "group", "aria-label": "Scale" })
            .class(groupClass)
            .children(
              ...presets.map((name) =>
                toggle(name === model.preset, Message.PickedPreset({ preset: name })).children(
                  name[0]!.toUpperCase() + name.slice(1),
                ),
              ),
            ),
          props.queries && view._tag === "Success"
            ? h.div
                .attrs({ role: "group", "aria-label": "Navigate" })
                .class(groupClass)
                .children(
                  Button(h, {
                    size: "sm",
                    variant: "outline",
                    onPress: Message.ClickedPrevious(),
                  }).children("Previous"),
                  Button(h, {
                    size: "sm",
                    variant: "outline",
                    onPress: Message.ClickedNext(),
                  }).children("Next"),
                )
            : undefined,
          h.div
            .attrs({ role: "group", "aria-label": "Time zone" })
            .class(groupClass)
            .children(
              ...timeZones.map((name) =>
                toggle(
                  name === model.timeZone,
                  Message.PickedTimeZone({ timeZone: name }),
                ).children(name),
              ),
            ),
        ),
        view._tag === "Success"
          ? Board(h, {
              view: view.success,
              preset: model.preset,
              input: props.input,
              queries: props.queries,
              resourceQueries: props.resourceQueries,
              editing: props.editing,
              proposed: (proposal) => Message.Proposed({ proposal }),
            })
          : problems(h, view.failure.issues),
      );
  },
});
