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
import { useMemo, useState } from "react";
import {
  adjacentAnchor,
  branchEnds,
  presets,
  Problems,
  rangeOf,
  scopeText,
  slotLabel,
  timeOf,
  timeZones,
  views,
  windowText,
} from "./board-shared";
import type { ResourceQueries } from "@omnisuite/calendar-sample-data/resource-queries";
import {
  sampleTimeline,
  type SampleBoard,
  type StayKind,
} from "@omnisuite/calendar-sample-data/sample-timeline";
import { useBoard, type EditingOptions, type SampleEvent } from "./use-board";
import type { WindowQueries } from "@omnisuite/calendar-sample-data/window-queries";

export type { EditingOptions } from "./use-board";

// Every class, label and setting below belongs to this example; edit them freely.

// Lanes fill the card and keep at least this much room for each slot, scrolling inside the
// viewport beyond that.
const slotWidth: Record<TimelinePreset, string> = {
  hour: "min-w-[calc(var(--timeline-span)*4.5rem)] flex-1",
  day: "min-w-[calc(var(--timeline-span)*7rem)] flex-1",
  week: "min-w-[calc(var(--timeline-span)*7rem)] flex-1",
  month: "min-w-[calc(var(--timeline-span)*7rem)] flex-1",
};

const rowWidth = "flex w-max min-w-full";
// A strip along an event's edge; the calendar renders it only where the edge can be resized.
const resizeHandle = "w-2 cursor-ew-resize hover:bg-primary/30";
const resourceColumn = "sticky start-0 z-10 w-52 shrink-0 border-e bg-card";

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
  queries?: WindowQueries<SampleEvent>;
  resourceQueries?: ResourceQueries;
} & EditingOptions) {
  const state = useBoard(view, { board, queries, resourceQueries }, editing);
  if (state.status === "invalid") return <Problems issues={state.error.issues} />;

  const { timeline, visibleRows, collapsedIds, toggleExpanded, editor, loading, resourceLoading } =
    state;
  const axisWidth = slotWidth[preset];
  const ends = branchEnds(visibleRows, collapsedIds);
  const renderRow = (row: TimelineRow<unknown, { kind: StayKind }>) => {
    const expanded = !collapsedIds.has(row.resource.id);
    const label = (
      <div
        className={cn(resourceColumn, "flex items-center gap-1 py-2 pe-3 text-sm font-medium")}
        style={{ paddingInlineStart: `${0.5 + row.depth * 0.75}rem` }}
      >
        {row.hasChildren ? (
          <ResourceTimeline.Disclosure
            row={row}
            expanded={expanded}
            onExpandedChange={() => toggleExpanded(row.resource.id)}
            className="flex size-6 shrink-0 items-center justify-center hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
          >
            <span aria-hidden="true">{expanded ? "▾" : "▸"}</span>
          </ResourceTimeline.Disclosure>
        ) : (
          <span aria-hidden="true" className="w-6 shrink-0" />
        )}
        <span
          className="truncate"
          role={row.kind === "group" ? "heading" : undefined}
          aria-level={row.kind === "group" ? row.depth + 1 : undefined}
        >
          {row.resource.title}
        </span>
      </div>
    );
    if (row.kind === "group")
      return (
        <ResourceTimeline.GroupRow
          key={row.resource.id}
          row={row}
          className={cn(rowWidth, "border-b bg-muted/40")}
        >
          {label}
          <div className={axisWidth} />
        </ResourceTimeline.GroupRow>
      );
    return (
      <ResourceTimeline.ResourceRow
        key={row.resource.id}
        row={row}
        className={cn(rowWidth, "border-b last:border-b-0")}
      >
        {label}
        <ResourceTimeline.Lane
          className={cn(axisWidth, "min-h-[calc(var(--timeline-lane-count)*3.5rem)]")}
        >
          {row.placements.map((placement) => {
            const { event } = placement;
            return (
              <ResourceTimeline.Event
                key={placement.occurrenceId}
                placement={placement}
                aria-label={`${event.title}, ${timeOf(event.start, timeline.timeZone)} – ${timeOf(event.end, timeline.timeZone)}`}
                className={cn(
                  "my-2 flex min-w-0 items-center overflow-hidden border-s-4 px-2 text-xs",
                  "data-movable:cursor-grab data-editable:focus-visible:outline-2 data-editable:focus-visible:outline-ring",
                  event.data?.kind === "maintenance"
                    ? "border-destructive bg-destructive/10"
                    : "border-primary bg-primary/10",
                  "data-starts-before:border-s-0 data-ends-after:border-e-0",
                )}
              >
                <ResourceTimeline.ResizeHandle edge="start" className={resizeHandle} />
                <span className="truncate font-medium">{event.title}</span>
                <ResourceTimeline.ResizeHandle edge="end" className={resizeHandle} />
              </ResourceTimeline.Event>
            );
          })}
          <ResourceTimeline.Preview className="my-2 flex min-w-0 items-center overflow-hidden border-2 border-dashed border-primary bg-primary/20 px-2 text-xs data-not-allowed:cursor-not-allowed data-not-allowed:border-destructive data-not-allowed:bg-destructive/20">
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
          aria-label="Room timeline"
          aria-busy={loading?.state.status === "pending"}
          className="max-h-[60vh] border-y focus-visible:outline-2 focus-visible:outline-ring"
        >
          <div className={cn(rowWidth, "border-b bg-muted/40 text-xs")}>
            <div className={cn(resourceColumn, "bg-muted px-3 py-2 font-medium")}>Room</div>
            <ResourceTimeline.Axis className={cn(axisWidth, "h-12")}>
              {timeline.slots.map((slot, index) => {
                const label = slotLabel(preset, slot, timeline.slots[index - 1]);
                return (
                  <ResourceTimeline.AxisSlot
                    key={slot.start.toString()}
                    slot={slot}
                    className="flex flex-col justify-center overflow-hidden border-e px-2 whitespace-nowrap data-repeated:bg-muted"
                  >
                    <span className="text-muted-foreground">{label.top}</span>
                    <strong>{label.bottom}</strong>
                  </ResourceTimeline.AxisSlot>
                );
              })}
            </ResourceTimeline.Axis>
          </div>
          {/* The window's state sits under the axis it describes; rows and events stay mounted. */}
          <ResourceTimeline.WindowStatus
            loading={loading}
            className={cn(rowWidth, "border-b text-xs data-[status=loaded]:border-b-0")}
          >
            {({ state: windowState, retry }) =>
              windowState.status === "loaded" ? null : (
                <>
                  <div className={cn(resourceColumn, "px-3 py-1.5 text-muted-foreground")}>
                    Events
                  </div>
                  <div className={cn(axisWidth, "flex items-center gap-3 px-3 py-1.5")}>
                    {windowState.status === "failed" ? (
                      <>
                        <span className="text-destructive">
                          Could not load events for this window. What is already loaded is still
                          shown.
                        </span>
                        <Button type="button" size="sm" variant="outline" onClick={retry}>
                          Retry
                        </Button>
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        {windowText[windowState.status]}
                      </span>
                    )}
                  </div>
                </>
              )
            }
          </ResourceTimeline.WindowStatus>
          {visibleRows.flatMap((row, index) => [
            renderRow(row),
            ...(ends.get(index) ?? []).map((parent) => (
              <ResourceTimeline.ScopeStatus
                key={`${parent.resource.id}-status`}
                scope={resourceLoading?.branch(parent.resource.id)}
                className={cn(rowWidth, "border-b text-xs empty:hidden")}
              >
                {(branch) => {
                  const text = scopeText(branch, parent.resource.title);
                  if (!text) return null;
                  return (
                    <>
                      <div
                        className={cn(resourceColumn, "flex items-center gap-2 py-1.5 pe-3")}
                        style={{ paddingInlineStart: `${1.75 + (parent.depth + 1) * 0.75}rem` }}
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
                      </div>
                      <div className={axisWidth} />
                    </>
                  );
                }}
              </ResourceTimeline.ScopeStatus>
            )),
          ])}
          {/* The end of the list asks for the next page when it comes into view. */}
          <ResourceTimeline.ListEnd loading={resourceLoading} className="h-px" />
          <ResourceTimeline.ScopeStatus
            scope={resourceLoading?.list}
            className={cn(rowWidth, "border-b text-xs empty:hidden")}
          >
            {(list) => {
              const hasRows = visibleRows.length > 0;
              if (list.state.status === "failed")
                return (
                  <div className={cn(resourceColumn, "flex items-center gap-3 px-3 py-1.5")}>
                    <span className="text-destructive">
                      Could not load more rooms. What is loaded is still shown.
                    </span>
                    <Button type="button" size="sm" variant="outline" onClick={list.retry}>
                      Retry
                    </Button>
                  </div>
                );
              if (list.state.status === "pending" || list.state.status === "unknown")
                return (
                  <div className={cn(resourceColumn, "px-3 py-1.5 text-muted-foreground")}>
                    {hasRows ? "Loading more rooms…" : "Loading rooms…"}
                  </div>
                );
              if (list.state.status === "loaded-empty")
                return (
                  <div className={cn(resourceColumn, "px-3 py-1.5 text-muted-foreground")}>
                    There are no rooms to show.
                  </div>
                );
              return null;
            }}
          </ResourceTimeline.ScopeStatus>
        </ResourceTimeline.Viewport>
      </ResourceTimeline.Root>
    </CardContent>
  );
}

export function ResourceTimelineExample({
  input = sampleTimeline,
  anchor: initialAnchor = "2026-10-26T12:00Z",
  initialPreset = "day",
  initialTimeZone = "UTC",
  queries,
  resourceQueries,
  ...editing
}: EditingOptions & {
  /** The resources and events to show. The range and slot size come from the scale chosen. */
  input?: SampleBoard;
  /** A moment inside the first slot; the range starts at the beginning of its slot unit. */
  anchor?: string;
  initialPreset?: TimelinePreset;
  initialTimeZone?: string;
  /**
   * Loads events window by window as the viewer navigates, through the application's own query
   * functions. Without it `input.events` is all there is and there is nothing to navigate to.
   */
  queries?: WindowQueries<SampleEvent>;
  /**
   * Loads resources as the viewer scrolls and expands, through the application's own query
   * functions. With it the rooms are what has been loaded so far, and `input.resources` is unused.
   */
  resourceQueries?: ResourceQueries;
}) {
  const [anchor, setAnchor] = useState(initialAnchor);
  const [preset, setPreset] = useState<TimelinePreset>(initialPreset);
  const [timeZone, setTimeZone] = useState(initialTimeZone);
  const view = useMemo(
    () => timelineViewResult({ preset, anchor, timeZone, ...views[preset] }),
    [preset, anchor, timeZone],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Front desk</CardTitle>
        <CardDescription>
          {view._tag === "Success" ? rangeOf(view.success) : "The timeline cannot be shown."}
        </CardDescription>
        <CardAction>
          <Badge variant="pill-color" color="gray">
            {editing.editing ? "Editable" : "Read-only"}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <ButtonGroup aria-label="Scale">
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
          <ButtonGroup aria-label="Navigate">
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
        <ButtonGroup aria-label="Time zone">
          {timeZones.map((name) => (
            <Button
              key={name}
              type="button"
              size="sm"
              variant={name === timeZone ? "default" : "outline"}
              aria-pressed={name === timeZone}
              onClick={() => setTimeZone(name)}
            >
              {name}
            </Button>
          ))}
        </ButtonGroup>
      </CardContent>
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
