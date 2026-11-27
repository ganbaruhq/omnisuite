import {
  timelineViewResult,
  type TimelinePreset,
  type TimelineRow,
  type TimelineView,
} from "@omnisuite/calendar-core";
import { ResourceTimeline } from "@omnisuite/calendar-react";
import { Badge } from "@omnisuite/ui/components/badge";
import { Button } from "@omnisuite/ui/components/button";
import { ButtonGroup } from "@omnisuite/ui/components/button-group";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@omnisuite/ui/components/card";
import { cn } from "cn";
import { useMemo, useState, type ComponentProps } from "react";
import {
  adjacentAnchor,
  branchEnds,
  presets,
  Problems,
  rangeOf,
  scopeText,
  slotLabel,
  timeOf,
  views,
  windowText,
} from "./board-shared";
import type { ResourceQueries } from "./resource-queries";
import { sampleTimeline, type SampleBoard, type StayKind } from "./sample-timeline";
import { useBoard, type EditingOptions, type SampleEvent } from "./use-board";
import type { WindowQueries } from "./window-queries";

// A second composition of the same calendar, to show what the first one does not fix. Behavior
// comes from `useBoard` (and through it `useResourceTimeline`) and from the unstyled parts; the
// layout is this file's own. Differences from the front desk board, all of them local choices:
//
// - each resource is a stacked section, its label above its lane instead of in a column beside it,
//   so a narrow screen keeps the whole label in view while the lane scrolls;
// - rows, groups, events, previews and disclosures are rendered through the parts' `render` prop as
//   this file's own elements and components, keeping the refs, handlers and accessible names;
// - the toolbar sits in the card header and has no time zone control.

/** The room this board gives each slot, as the lane's width. */
const laneWidth = "w-[calc(var(--timeline-span)*6rem)]";
const rowWidth = "w-max min-w-full";
// A strip along an event's edge; the calendar renders it only where the edge can be resized.
const resizeHandle = "w-2 cursor-ew-resize hover:bg-primary/30";
// A label stays at the left of the viewport while its lane scrolls under it.
const sticky = "sticky start-0 z-10 w-fit max-w-[100vw]";

/**
 * A stay or a task as a chip: a locally owned component that takes the part's props and ref like
 * any shadcn component does. It is given to `ResourceTimeline.Event` as its `render`, so the
 * element is this one, and the part supplies its role, name, placement, ref and handlers.
 */
function Chip({
  kind,
  className,
  ref,
  ...props
}: ComponentProps<"article"> & { kind?: StayKind | undefined }) {
  return (
    <article
      ref={ref}
      data-slot="chip"
      data-kind={kind}
      className={cn(
        "my-1.5 flex min-w-0 items-center gap-1 overflow-hidden border px-2 text-xs",
        "bg-primary/10 data-[kind=maintenance]:border-destructive data-[kind=maintenance]:bg-destructive/10",
        "data-movable:cursor-grab data-editable:focus-visible:outline-2 data-editable:focus-visible:outline-ring",
        "data-dragging:cursor-grabbing",
        className,
      )}
      {...props}
    />
  );
}

function Board({
  view,
  preset,
  board,
  queries,
  resourceQueries,
  ...editing
}: {
  view: TimelineView;
  preset: TimelinePreset;
  board: SampleBoard;
  queries?: WindowQueries<SampleEvent> | undefined;
  resourceQueries?: ResourceQueries | undefined;
} & EditingOptions) {
  const state = useBoard(view, { board, queries, resourceQueries }, editing);
  if (state.status === "invalid") return <Problems issues={state.error.issues} />;

  const { timeline, visibleRows, collapsedIds, toggleExpanded, editor, loading, resourceLoading } =
    state;
  const ends = branchEnds(visibleRows, collapsedIds);

  const renderRow = (row: TimelineRow<unknown, { kind: StayKind }>) => {
    const expanded = !collapsedIds.has(row.resource.id);
    const label = (
      <div
        className={cn(sticky, "flex items-center gap-1 bg-card py-1 pe-3")}
        style={{ paddingInlineStart: `${0.25 + row.depth * 0.75}rem` }}
      >
        {row.hasChildren ? (
          <ResourceTimeline.Disclosure
            row={row}
            expanded={expanded}
            onExpandedChange={() => toggleExpanded(row.resource.id)}
            // The shared Button is the disclosure's element, so it looks and focuses like every
            // other button of the application.
            render={<Button variant="ghost" size="icon-xs" />}
          >
            <span aria-hidden="true">{expanded ? "▾" : "▸"}</span>
          </ResourceTimeline.Disclosure>
        ) : null}
        <span
          className="truncate text-sm font-medium"
          role={row.kind === "group" ? "heading" : undefined}
          aria-level={row.kind === "group" ? row.depth + 1 : undefined}
        >
          {row.resource.title}
        </span>
        {row.kind === "resource" ? (
          <Badge variant="modern" color="gray">
            {row.placements.length} on show
          </Badge>
        ) : null}
      </div>
    );
    if (row.kind === "group")
      return (
        <ResourceTimeline.GroupRow
          key={row.resource.id}
          row={row}
          render={<header />}
          className={cn(rowWidth, "border-b bg-muted/50")}
        >
          {label}
        </ResourceTimeline.GroupRow>
      );
    return (
      <ResourceTimeline.ResourceRow
        key={row.resource.id}
        row={row}
        render={<section />}
        className={cn(rowWidth, "border-b")}
      >
        {label}
        <ResourceTimeline.Lane
          className={cn(laneWidth, "min-h-[calc(var(--timeline-lane-count)*3rem)]")}
        >
          {row.placements.map((placement) => {
            const { event } = placement;
            return (
              <ResourceTimeline.Event
                key={placement.occurrenceId}
                placement={placement}
                render={<Chip kind={event.data?.kind} />}
                aria-label={`${event.title}, ${timeOf(event.start, timeline.timeZone)} – ${timeOf(event.end, timeline.timeZone)}`}
              >
                <ResourceTimeline.ResizeHandle edge="start" className={resizeHandle} />
                <span className="truncate font-medium">{event.title}</span>
                {event.data?.kind === "maintenance" ? (
                  <Badge variant="color" color="error">
                    Task
                  </Badge>
                ) : null}
                <ResourceTimeline.ResizeHandle edge="end" className={resizeHandle} />
              </ResourceTimeline.Event>
            );
          })}
          <ResourceTimeline.Preview
            render={
              <Chip className="border-2 border-dashed border-primary bg-primary/20 data-not-allowed:cursor-not-allowed data-not-allowed:border-destructive data-not-allowed:bg-destructive/20" />
            }
          >
            {({ placement }) => (
              <span className="truncate font-medium">{placement?.event.title}</span>
            )}
          </ResourceTimeline.Preview>
        </ResourceTimeline.Lane>
      </ResourceTimeline.ResourceRow>
    );
  };

  return (
    <CardContent className="px-0">
      <ResourceTimeline.Status className="sr-only" />
      <ResourceTimeline.Root timeline={timeline} editor={editor}>
        <ResourceTimeline.Viewport
          aria-label="Housekeeping timeline"
          aria-busy={loading?.state.status === "pending"}
          className="max-h-[50vh] border-y focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ResourceTimeline.Axis
            className={cn(laneWidth, "sticky top-0 z-20 h-12 border-b bg-muted text-xs")}
          >
            {timeline.slots.map((slot, index) => {
              const label = slotLabel(preset, slot, timeline.slots[index - 1]);
              return (
                <ResourceTimeline.AxisSlot
                  key={slot.start.toString()}
                  slot={slot}
                  className="flex flex-col justify-center overflow-hidden border-e px-2 whitespace-nowrap data-repeated:bg-accent"
                >
                  <span className="text-muted-foreground">{label.top}</span>
                  <strong>{label.bottom}</strong>
                </ResourceTimeline.AxisSlot>
              );
            })}
          </ResourceTimeline.Axis>
          <ResourceTimeline.WindowStatus
            loading={loading}
            className={cn(sticky, "text-xs data-[status=loaded]:hidden")}
          >
            {({ state: windowState, retry }) =>
              windowState.status === "loaded" ? null : (
                <p className="flex items-center gap-3 px-3 py-1.5">
                  {windowState.status === "failed" ? (
                    <>
                      <span className="text-destructive">
                        Could not load tasks for this window. What is loaded is still shown.
                      </span>
                      <Button type="button" size="sm" variant="outline" onClick={retry}>
                        Retry
                      </Button>
                    </>
                  ) : (
                    <span className="text-muted-foreground">{windowText[windowState.status]}</span>
                  )}
                </p>
              )
            }
          </ResourceTimeline.WindowStatus>
          {visibleRows.flatMap((row, index) => [
            renderRow(row),
            ...(ends.get(index) ?? []).map((parent) => (
              <ResourceTimeline.ScopeStatus
                key={`${parent.resource.id}-status`}
                scope={resourceLoading?.branch(parent.resource.id)}
                className={cn(sticky, "border-b text-xs empty:hidden")}
              >
                {(branch) => {
                  const text = scopeText(branch, parent.resource.title);
                  if (!text) return null;
                  return (
                    <p
                      className="flex items-center gap-2 py-1.5 pe-3"
                      style={{ paddingInlineStart: `${1 + (parent.depth + 1) * 0.75}rem` }}
                    >
                      <span
                        className={
                          branch.state.status === "failed"
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }
                      >
                        {text.message}
                      </span>
                      {text.action ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          aria-label={`${text.action.label} ${parent.resource.title}`}
                          onClick={text.action.run}
                        >
                          {text.action.verb}
                        </Button>
                      ) : null}
                    </p>
                  );
                }}
              </ResourceTimeline.ScopeStatus>
            )),
          ])}
          <ResourceTimeline.ListEnd loading={resourceLoading} className="h-px" />
          <ResourceTimeline.ScopeStatus
            scope={resourceLoading?.list}
            className={cn(sticky, "text-xs empty:hidden")}
          >
            {(list) => {
              if (list.state.status === "failed")
                return (
                  <p className="flex items-center gap-3 px-3 py-1.5">
                    <span className="text-destructive">
                      Could not load more rooms. What is loaded is still shown.
                    </span>
                    <Button type="button" size="sm" variant="outline" onClick={list.retry}>
                      Retry
                    </Button>
                  </p>
                );
              if (list.state.status === "pending" || list.state.status === "unknown")
                return (
                  <p className="px-3 py-1.5 text-muted-foreground">
                    {visibleRows.length > 0 ? "Loading more rooms…" : "Loading rooms…"}
                  </p>
                );
              if (list.state.status === "loaded-empty")
                return (
                  <p className="px-3 py-1.5 text-muted-foreground">There are no rooms to show.</p>
                );
              return null;
            }}
          </ResourceTimeline.ScopeStatus>
        </ResourceTimeline.Viewport>
      </ResourceTimeline.Root>
    </CardContent>
  );
}

export function HousekeepingExample({
  input = sampleTimeline,
  anchor: initialAnchor = "2026-10-26T12:00Z",
  initialPreset = "day",
  timeZone = "UTC",
  queries,
  resourceQueries,
  ...editing
}: EditingOptions & {
  /** The resources and events to show. The range and slot size come from the scale chosen. */
  input?: SampleBoard;
  /** A moment inside the first slot; the range starts at the beginning of its slot unit. */
  anchor?: string;
  initialPreset?: TimelinePreset;
  timeZone?: string;
  queries?: WindowQueries<SampleEvent>;
  resourceQueries?: ResourceQueries;
}) {
  const [anchor, setAnchor] = useState(initialAnchor);
  const [preset, setPreset] = useState<TimelinePreset>(initialPreset);
  const view = useMemo(
    () => timelineViewResult({ preset, anchor, timeZone, ...views[preset] }),
    [preset, anchor, timeZone],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Housekeeping</CardTitle>
        <CardDescription>
          {view._tag === "Success" ? rangeOf(view.success) : "The timeline cannot be shown."}
        </CardDescription>
        <CardAction className="flex flex-wrap justify-end gap-2">
          <ButtonGroup aria-label="Housekeeping scale">
            {presets.map((name) => (
              <Button
                key={name}
                type="button"
                size="sm"
                variant={name === preset ? "default" : "outline"}
                aria-pressed={name === preset}
                onClick={() => setPreset(name)}
              >
                {name[0]!.toUpperCase() + name.slice(1)}
              </Button>
            ))}
          </ButtonGroup>
          {queries && view._tag === "Success" ? (
            <ButtonGroup aria-label="Housekeeping navigation">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setAnchor(adjacentAnchor(view.success, preset, -1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setAnchor(adjacentAnchor(view.success, preset, 1))}
              >
                Next
              </Button>
            </ButtonGroup>
          ) : null}
        </CardAction>
      </CardHeader>
      {view._tag === "Success" ? (
        <Board
          view={view.success}
          preset={preset}
          board={input}
          queries={queries}
          resourceQueries={resourceQueries}
          {...editing}
        />
      ) : (
        <Problems issues={view.failure.issues} />
      )}
    </Card>
  );
}
