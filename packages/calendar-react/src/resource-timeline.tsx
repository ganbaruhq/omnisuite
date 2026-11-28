import {
  collapsedIdsOf,
  decodeTimelineResult,
  disclosureDescriptionOf,
  disclosureLabelOf,
  expansionToggleOf,
  laneLabelOf,
  placementBoxOf,
  resizableEdgesOf,
  slotBoxOf,
  resourceHierarchyLogic,
  visibleTimelineRows,
  type EventPlacement,
  type ResizeEdge,
  type Timeline,
  type TimelineInput,
  TimelineInputError,
  type TimelineRow,
  type TimelineResourceRow,
  type TimelineGroupRow,
  type TimelineSlot,
} from "@omnisuite/calendar-core";
import { DragDropProvider, PointerSensor, useDraggable } from "@dnd-kit/react";
import { Accessibility, Feedback, PointerActivationConstraints } from "@dnd-kit/dom";
import { useSelector, useStore } from "@xstate/store-react";
import { composeRefs, renderHost, type Render } from "./host.js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ComponentProps,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type Ref,
} from "react";
import {
  useEditingResult,
  useEditor,
  type EditorOptions,
  type EditorPreview,
  type TimelineEditor,
} from "./use-editor.js";
import {
  useResourceLoading,
  type ResourceLoading,
  type ResourceLoadingOptions,
  type ResourceScopeLoading,
} from "./use-resource-loading.js";
import {
  useWindowLoading,
  type WindowLoading,
  type WindowLoadingOptions,
} from "./use-window-loading.js";

export type ResourceTimelineState<TResourceData = unknown, TEventData = unknown> =
  | {
      readonly status: "ready";
      readonly timeline: Timeline<TResourceData, TEventData>;
      readonly visibleRows: readonly TimelineRow<TResourceData, TEventData>[];
      readonly collapsedIds: ReadonlySet<string>;
      readonly toggleExpanded: (id: string) => void;
      /** Pass to `Root` to let events be edited; undefined while the timeline is read-only. */
      readonly editor: TimelineEditor | undefined;
      /** The window the timeline needs now; undefined unless `loading` is given. */
      readonly loading: WindowLoading | undefined;
      /** The pages of resources the timeline needs; undefined unless `resourceLoading` is given. */
      readonly resourceLoading: ResourceLoading | undefined;
    }
  | { readonly status: "invalid"; readonly error: TimelineInputError };

export type ResourceTimelineInput<TResourceData = unknown, TEventData = unknown> = TimelineInput<
  TResourceData,
  TEventData
> &
  EditorOptions<TEventData> & {
    /**
     * Turns window loading on: the timeline signals the window it needs and reports what the
     * application knows about it. Without it the supplied events are all there is.
     */
    readonly loading?: WindowLoadingOptions;
    /**
     * Turns resource loading on: the timeline asks for another page of resources as the viewer
     * scrolls to the end of the list, and for the children of a parent with `lazyChildren` when it
     * is first expanded. Without it the supplied resources are all there is.
     */
    readonly resourceLoading?: ResourceLoadingOptions;
  };

/**
 * Lays out a resource timeline, read-only unless `editing` is given. The input is validated and
 * laid out again only when its range, slot duration, time zone, disambiguation, resources or
 * events change; invalid input, including invalid editing options, is returned as an error rather
 * than thrown, so the application decides what to show.
 *
 * While an event is dragged or moved with the keyboard, `visibleRows` lays out the destination row
 * around the preview, and the dragged rendering stays in its row, hidden. Events are never
 * changed by the calendar: an allowed drop calls `onProposal`, and the application decides.
 *
 * With `loading`, the window the timeline shows is signalled to `onLoadWindow` after render and
 * its coverage is returned as `loading`. The supplied events are rendered whatever the coverage
 * is, so content that is already loaded stays while a window is pending or has failed.
 *
 * With `resourceLoading`, the top level of the tree and the children of each expanded parent are
 * loaded in pages through `onLoad`, each scope with its own cursor, pending state and failure,
 * returned as `resourceLoading`. A parent with `lazyChildren` starts collapsed. Expansion is the
 * viewer's: a response that arrives after a branch was collapsed never reopens it.
 */
export function useResourceTimeline<TResourceData = unknown, TEventData = unknown>(
  input: ResourceTimelineInput<TResourceData, TEventData>,
): ResourceTimelineState<TResourceData, TEventData> {
  const { range, slotDuration, timeZone, disambiguation, resources, events } = input;
  const hierarchy = useStore(resourceHierarchyLogic);
  const expansion = useSelector(hierarchy, (snapshot) => snapshot.context);
  const result = useMemo(() => {
    // Decoding is a pure, synchronous transformation; no Effect runs during render.
    return decodeTimelineResult({
      range: { start: range.start, end: range.end },
      slotDuration,
      timeZone,
      disambiguation,
      resources,
      events,
    });
  }, [range.start, range.end, slotDuration, timeZone, disambiguation, resources, events]);
  // Nodes with children to load start collapsed; the viewer's own choice always wins.
  const collapsedIds = useMemo(
    () =>
      result._tag === "Success"
        ? collapsedIdsOf(result.success.rows, expansion)
        : expansion.collapsedIds,
    [result, expansion],
  );
  const baseRows = useMemo(
    () => (result._tag === "Success" ? visibleTimelineRows(result.success.rows, collapsedIds) : []),
    [result, collapsedIds],
  );
  const decodedEditing = useEditingResult(input.editing, disambiguation);
  const editing =
    decodedEditing === undefined || decodedEditing instanceof TimelineInputError
      ? undefined
      : decodedEditing;
  const { editor, rows: visibleRows } = useEditor({
    timeline: result._tag === "Success" ? result.success : undefined,
    editing,
    rows: baseRows,
    options: input,
  });
  const loading = useWindowLoading(
    result._tag === "Success" ? result.success : undefined,
    input.loading,
  );
  const resourceLoading = useResourceLoading(
    result._tag === "Success" ? result.success : undefined,
    collapsedIds,
    input.resourceLoading,
  );
  const toggleExpanded = useCallback(
    (id: string) => {
      if (result._tag !== "Success") return;
      const toggle = expansionToggleOf(result.success.rows, collapsedIds, id);
      if (toggle) hierarchy.trigger.setExpanded(toggle);
    },
    [result, hierarchy, collapsedIds],
  );
  if (result._tag !== "Success") return { status: "invalid", error: result.failure };
  if (decodedEditing instanceof TimelineInputError)
    return { status: "invalid", error: decodedEditing };
  return {
    status: "ready",
    timeline: result.success,
    visibleRows,
    collapsedIds,
    toggleExpanded,
    editor,
    loading,
    resourceLoading,
  };
}

const TimelineContext = createContext<Timeline | null>(null);
const RowContext = createContext<TimelineResourceRow | null>(null);
const EditorContext = createContext<TimelineEditor | null>(null);
const PlacementContext = createContext<EventPlacement<any> | null>(null);

/** Hands one element to several refs; the returned function is stable across renders. */
function useMergedRef<T>(...refs: (Ref<T> | undefined)[]) {
  const latest = useRef(refs);
  latest.current = refs;
  return useCallback((element: T | null) => composeRefs(...latest.current)(element), []);
}

// A drag begins after the pointer has been held in place; keyboard moves are handled by the parts.
const sensors = [
  PointerSensor.configure({
    activationConstraints: () => [
      new PointerActivationConstraints.Delay({ value: 200, tolerance: 8 }),
    ],
    // A press on a resize handle resizes at once; it must not also be held for a move.
    preventActivation: (event, source) =>
      (event.target instanceof Element &&
        event.target.closest("[data-timeline-resize-handle]") !== null) ||
      PointerSensor.defaults.preventActivation?.(event, source) === true,
  }),
];
// The calendar draws its own preview and description, so dnd-kit's floating clone and
// announcements are left out.
const plugins = (defaults: typeof import("@dnd-kit/dom").defaultPreset.plugins) =>
  defaults.filter((plugin) => plugin !== Feedback && plugin !== Accessibility);

function useTimelineContext(part: string) {
  const timeline = useContext(TimelineContext);
  if (!timeline) throw new Error(`ResourceTimeline.${part} must be inside ResourceTimeline.Root.`);
  return timeline;
}

const percent = (value: number) => `${value}%`;

/** Every part that renders one element takes `render` to swap it; see {@link Render}. */
type Hosted<TElement extends "div" | "button" = "div"> = ComponentProps<TElement> & {
  render?: Render<ComponentProps<TElement>>;
};

type RootProps = ComponentProps<"div"> & {
  timeline: Timeline<any, any>;
  /** From {@link useResourceTimeline}; omit it and events cannot be moved. */
  editor?: TimelineEditor | undefined;
};

/**
 * Provides the timeline to its parts. Sets `--timeline-span`, the width of the range in slot
 * units, so a consumer can size the time axis, for example `calc(var(--timeline-span) * 4rem)`.
 * While an event is being edited it has `data-gesture` ("pointer" or "keyboard") and
 * `data-operation` ("move" or "resize"), and after a cancelled edit `data-cancel-reason` says why,
 * until the next edit begins.
 */
function Root({ timeline, editor, style, ...props }: RootProps) {
  const root = (
    <div
      data-timeline-root=""
      data-gesture={editor?.gesture?.input}
      data-operation={editor?.gesture?.operation}
      data-cancel-reason={editor?.cancellation}
      {...props}
      style={{ "--timeline-span": timeline.span, ...style } as CSSProperties}
    />
  );
  return (
    <TimelineContext.Provider value={timeline}>
      <EditorContext.Provider value={editor ?? null}>
        {editor ? (
          <DragDropProvider
            sensors={sensors}
            plugins={plugins}
            onDragStart={(event, manager) => {
              editor.pointer.attach(manager);
              const { eventId, resourceId } = event.operation.source?.data ?? {};
              const { clientX, clientY } = event.operation.activatorEvent as PointerEvent;
              editor.pointer.start(eventId, resourceId, { x: clientX, y: clientY });
            }}
            onDragEnd={(event) => editor.pointer.end(event.canceled)}
          >
            {root}
          </DragDropProvider>
        ) : (
          root
        )}
      </EditorContext.Provider>
    </TimelineContext.Provider>
  );
}

/**
 * The scroll container. It is focusable so keyboard users can scroll it. While an event is moved,
 * the pointer must be inside it to be over a resource.
 */
function Viewport({ style, ref, ...props }: ComponentProps<"div">) {
  useTimelineContext("Viewport");
  const editor = useContext(EditorContext);
  const registered = useCallback(
    (element: HTMLDivElement | null) => editor?.registerViewport(element),
    [editor?.registerViewport],
  );
  return (
    <div
      ref={useMergedRef(ref, registered)}
      data-timeline-viewport=""
      tabIndex={0}
      {...props}
      style={{ overflow: "auto", ...style }}
    />
  );
}

/** The positioning context for axis slots; give it the width of the time axis. */
function Axis({ style, ...props }: ComponentProps<"div">) {
  useTimelineContext("Axis");
  return <div data-timeline-axis="" {...props} style={{ position: "relative", ...style }} />;
}

/**
 * One slot of the axis, placed over its share of the range. `data-repeated` marks a slot whose
 * clock time the display time zone shows twice, so labels can add the offset.
 */
function AxisSlot({
  slot,
  style,
  ...props
}: Omit<ComponentProps<"div">, "slot"> & { slot: TimelineSlot }) {
  const timeline = useTimelineContext("AxisSlot");
  return (
    <div
      data-timeline-slot=""
      data-repeated={slot.repeated || undefined}
      {...props}
      style={{
        position: "absolute",
        insetBlock: 0,
        ...slotStyle(timeline, slot),
        ...style,
      }}
    />
  );
}

/** A resource's row, named by the resource's title. */
function ResourceRow({ row, ref, render, ...props }: Hosted & { row: TimelineResourceRow }) {
  useTimelineContext("ResourceRow");
  const editor = useContext(EditorContext);
  const resourceId = row.resource.id;
  const registered = useCallback(
    (element: HTMLDivElement | null) => editor?.registerRow(resourceId, element),
    [editor?.registerRow, resourceId],
  );
  return (
    <RowContext.Provider value={row}>
      {renderHost(
        "div",
        {
          ref: useMergedRef(ref, registered),
          role: "group",
          "aria-label": row.resource.title,
          "data-timeline-row": "",
          "data-resource-id": row.resource.id,
          "data-kind": "resource",
          "data-depth": row.depth,
          ...props,
        },
        render,
      )}
    </RowContext.Provider>
  );
}

/** An organizational heading with no event lane or resource target. */
function GroupRow({ row, render, ...props }: Hosted & { row: TimelineGroupRow }) {
  useTimelineContext("GroupRow");
  return renderHost(
    "div",
    {
      role: "group",
      "aria-label": row.resource.title,
      "data-timeline-row": "",
      "data-group-id": row.resource.id,
      "data-kind": "group",
      "data-depth": row.depth,
      ...props,
    },
    render,
  );
}

/** A native disclosure; Enter and Space activate it while focus stays on the button. */
function Disclosure({
  row,
  expanded,
  onExpandedChange,
  onClick,
  render,
  ...props
}: Hosted<"button"> & {
  row: TimelineRow;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}) {
  if (!row.hasChildren) return null;
  return renderHost(
    "button",
    {
      "aria-label": disclosureLabelOf(row, expanded),
      "aria-description": disclosureDescriptionOf(row),
      ...props,
      type: "button",
      "data-timeline-disclosure": "",
      "data-depth": row.depth,
      "aria-expanded": expanded,
      onClick: (event: ReactMouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) onExpandedChange(!expanded);
      },
    },
    render,
  );
}

/**
 * The positioning context for a row's events; give it the width of the time axis. Sets
 * `--timeline-lane-count`, the number of lanes the row's events take, so a consumer can make the
 * row grow with them, for example `min-height: calc(var(--timeline-lane-count) * 2.5rem)`.
 */
function Lane({ style, ref, render, ...props }: Hosted) {
  useTimelineContext("Lane");
  const row = useContext(RowContext);
  const editor = useContext(EditorContext);
  const resourceId = row?.resource.id;
  const registered = useCallback(
    (element: HTMLDivElement | null) => {
      if (resourceId !== undefined) editor?.registerLane(resourceId, element);
    },
    [editor?.registerLane, resourceId],
  );
  return renderHost(
    "div",
    {
      ref: useMergedRef(ref, registered),
      role: "list",
      "aria-label": row ? laneLabelOf(row) : undefined,
      "data-timeline-lane": "",
      ...props,
      style: {
        position: "relative",
        "--timeline-lane-count": row?.laneCount ?? 1,
        ...style,
      } as CSSProperties,
    },
    render,
  );
}

/** The box of an occurrence or a preview within its row. */
function placementStyle(timeline: Timeline, laneCount: number, placement: EventPlacement<any>) {
  const box = placementBoxOf(timeline, laneCount, placement);
  return {
    position: "absolute",
    insetInlineStart: percent(box.inlineStart),
    width: percent(box.inlineSize),
    insetBlockStart: percent(box.blockStart),
    insetBlockEnd: percent(box.blockEnd),
  } satisfies CSSProperties;
}

/** The extent of a slot along the time axis. */
function slotStyle(timeline: Timeline, slot: TimelineSlot) {
  const box = slotBoxOf(timeline, slot);
  return { insetInlineStart: percent(box.inlineStart), width: percent(box.inlineSize) };
}

type EventProps = Hosted & { placement: EventPlacement<any> };

/**
 * One occurrence of an event, placed over its share of the range and in its own lane: it spans
 * one lane's share of the lane's height, so events that overlap do not cover each other.
 * `data-starts-before` and `data-ends-after` mark an event that the range clips. An event shared
 * by several resources has an `Event` in each row; they have the same `data-event-id` and
 * different `data-occurrence-id` values.
 *
 * When the event can be edited it is focusable (`data-editable`). When it can be moved
 * (`data-movable`) it moves by holding the pointer on it and dragging, or by Enter or Space, then
 * the arrow keys (left and right by a snap step, up and down by a row), and Enter or Space again
 * to drop it or Escape to cancel. When it can be resized (`data-resizable`) its edges resize by
 * `ResizeHandle` with the pointer, or by the keyboard: Alt and the left or right arrow starts
 * resizing the start edge and Shift and the arrow the end edge, the arrows then move that edge by
 * a snap step, and Enter or Space proposes it and Escape cancels. While it is edited it is hidden
 * (`data-dragging`) and the result is shown by `Preview`. A click does nothing of its own, so the
 * application may open its details. A key handler that prevents the default stops the keyboard
 * edit.
 */
function Event(props: EventProps) {
  const editor = useContext(EditorContext);
  return (
    <PlacementContext.Provider value={props.placement}>
      {editor?.canEdit(props.placement.event) ? (
        <EditableEvent {...props} editor={editor} />
      ) : (
        <ReadOnlyEvent {...props} />
      )}
    </PlacementContext.Provider>
  );
}

function ReadOnlyEvent({ placement, style, render, ...props }: EventProps) {
  const timeline = useTimelineContext("Event");
  const row = useContext(RowContext);
  return renderHost(
    "div",
    {
      role: "listitem",
      "data-timeline-event": "",
      "data-event-id": placement.event.id,
      "data-occurrence-id": placement.occurrenceId,
      "data-lane": placement.lane,
      "data-starts-before": placement.startsBefore || undefined,
      "data-ends-after": placement.endsAfter || undefined,
      ...props,
      style: { ...placementStyle(timeline, row?.laneCount ?? 1, placement), ...style },
    },
    render,
  );
}

function EditableEvent({
  placement,
  editor,
  style,
  ref,
  render,
  onKeyDown,
  onBlur,
  ...props
}: EventProps & { editor: TimelineEditor }) {
  const timeline = useTimelineContext("Event");
  const row = useContext(RowContext);
  const { occurrenceId } = placement;
  const movable = editor.canMove(placement.event);
  const resizable = editor.canResize(placement.event);
  // Only an actual endpoint of the event can be resized, not one that the range clips.
  const edges = resizableEdgesOf(placement, resizable);
  const { ref: draggableRef } = useDraggable({
    id: occurrenceId,
    data: { eventId: placement.event.id, resourceId: placement.resourceId },
    disabled: !movable,
  });
  const element = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (editor.takeFocus(occurrenceId)) element.current?.focus();
  }, [editor, occurrenceId]);
  const gesture = editor.gesture;
  const dragging = gesture?.occurrenceId === occurrenceId;
  const editing = dragging && gesture?.input === "keyboard";

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.target !== event.currentTarget) return;
    const confirm = event.key === "Enter" || event.key === " ";
    const sideways = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!editing) {
      if (gesture) return;
      if (confirm) {
        if (!movable) return;
        event.preventDefault();
        editor.keyboard.start(placement.event.id, placement.resourceId);
      } else if (sideways !== undefined && !event.ctrlKey && !event.metaKey) {
        // Alt takes the start edge and Shift the end edge, so a narrow event needs no handle.
        const edge: ResizeEdge | undefined = event.altKey
          ? "start"
          : event.shiftKey
            ? "end"
            : undefined;
        if (!edge || !edges[edge]) return;
        event.preventDefault();
        editor.keyboard.startResize(placement.event.id, placement.resourceId, edge);
        editor.keyboard.step(sideways);
      }
      return;
    }
    if (confirm) {
      event.preventDefault();
      editor.keyboard.confirm();
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      editor.keyboard.cancel("escape");
    } else if (sideways !== undefined) {
      event.preventDefault();
      editor.keyboard.step(sideways);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      // A resize keeps its row.
      editor.keyboard.row(event.key === "ArrowDown" ? 1 : -1);
    }
  };

  const shortcuts = [
    movable && "Enter Space",
    edges.start && "Alt+ArrowLeft Alt+ArrowRight",
    edges.end && "Shift+ArrowLeft Shift+ArrowRight",
  ]
    .filter(Boolean)
    .join(" ");

  return renderHost(
    "div",
    {
      ref: useMergedRef(ref, draggableRef, element),
      role: "listitem",
      tabIndex: 0,
      "aria-keyshortcuts": shortcuts,
      "data-timeline-event": "",
      "data-event-id": placement.event.id,
      "data-occurrence-id": occurrenceId,
      "data-lane": placement.lane,
      "data-starts-before": placement.startsBefore || undefined,
      "data-ends-after": placement.endsAfter || undefined,
      "data-editable": "",
      "data-movable": movable || undefined,
      "data-resizable": resizable || undefined,
      "data-dragging": dragging || undefined,
      ...props,
      onKeyDown: handleKeyDown,
      onBlur: (event: ReactFocusEvent<HTMLDivElement>) => {
        onBlur?.(event);
        if (editing) editor.keyboard.cancel("blur");
      },
      style: {
        ...placementStyle(timeline, row?.laneCount ?? 1, placement),
        ...style,
        // The destination preview stands in for the dragged rendering, which only keeps its place.
        ...(dragging && { opacity: 0, pointerEvents: "none" }),
      },
    },
    render,
  );
}

/**
 * A pointer target on one edge of an `Event`; render it inside the `Event`, once per edge. It is
 * rendered only when the event can be resized and the edge is the event's actual endpoint, not
 * one that the range clips, so a disabled or clipped edge has no handle. It is placed over that
 * edge of the event and needs a width, such as `w-2`. Pressing it resizes at once, with no hold,
 * and the edge follows the pointer along the time axis, snapped to the calendar grid, until the
 * pointer is released or Escape is pressed. It is hidden from assistive technology and cannot be
 * focused, because resizing by keyboard is done on the `Event`.
 */
function ResizeHandle({
  edge,
  style,
  onPointerDown,
  ...props
}: ComponentProps<"div"> & { edge: ResizeEdge }) {
  useTimelineContext("ResizeHandle");
  const placement = useContext(PlacementContext);
  const editor = useContext(EditorContext);
  if (
    !placement ||
    !editor ||
    !resizableEdgesOf(placement, editor.canResize(placement.event))[edge]
  )
    return null;
  return (
    <div
      aria-hidden="true"
      data-timeline-resize-handle=""
      data-edge={edge}
      {...props}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (event.defaultPrevented || !event.isPrimary || event.button !== 0) return;
        // No text selection, and no native drag, while the edge is followed.
        event.preventDefault();
        editor.pointer.startResize(placement.event.id, placement.resourceId, edge, {
          x: event.clientX,
          y: event.clientY,
        });
      }}
      style={{
        position: "absolute",
        insetBlock: 0,
        ...(edge === "start" ? { insetInlineStart: 0 } : { insetInlineEnd: 0 }),
        touchAction: "none",
        ...style,
      }}
    />
  );
}

/**
 * The result of the edit in progress, in the row it would land in; render it inside every
 * `Lane`. For a move it is the destination, and for a resize the event with the dragged edge
 * where it would go. It appears only in that row, and only while a gesture has a result in the
 * visible range. Children may be a function of the preview. Its accessible name describes the
 * result, or says "Not allowed" when a rule rejects it (`data-status="rejected"`); releasing a
 * rejected result emits nothing.
 */
function Preview({
  style,
  children,
  render,
  ...props
}: Omit<Hosted, "children"> & {
  children?: ReactNode | ((preview: EditorPreview) => ReactNode);
}) {
  const timeline = useTimelineContext("Preview");
  const row = useContext(RowContext);
  const preview = useContext(EditorContext)?.preview;
  const placement = preview?.placement;
  if (!preview || !placement || !row || preview.resourceId !== row.resource.id) return null;
  return renderHost(
    "div",
    {
      role: "listitem",
      "aria-label": preview.description,
      "data-timeline-preview": "",
      "data-status": preview.status,
      "data-not-allowed": preview.status === "rejected" || undefined,
      "data-rule": preview.rule,
      "data-event-id": placement.event.id,
      "data-lane": placement.lane,
      "data-starts-before": placement.startsBefore || undefined,
      "data-ends-after": placement.endsAfter || undefined,
      ...props,
      style: {
        ...placementStyle(timeline, row.laneCount, placement),
        pointerEvents: "none",
        ...style,
      },
      children: typeof children === "function" ? children(preview) : children,
    },
    render,
  );
}

/**
 * A polite live region that announces the result while an event is moved or resized and then how
 * the edit ended. Hide it visually if you like, but keep it rendered.
 */
function Status(props: ComponentProps<"div">) {
  const editor = useContext(EditorContext);
  return (
    <div role="status" aria-live="polite" aria-atomic="true" data-timeline-status="" {...props}>
      {editor?.message}
    </div>
  );
}

/**
 * What the application knows about the window being shown, as a polite live region. It has
 * `data-status` (`unknown`, `pending`, `loaded`, `loaded-empty` or `failed`) and renders nothing
 * of its own: children may be a function of the state, for a placeholder, a message or a retry
 * button. Place it beside the lanes it describes; the rows and events stay mounted around it.
 */
function WindowStatus({
  loading,
  children,
  ...props
}: Omit<ComponentProps<"div">, "children"> & {
  loading: WindowLoading<any> | undefined;
  children?: ReactNode | ((loading: WindowLoading<any>) => ReactNode);
}) {
  if (!loading) return null;
  return (
    <div
      role="status"
      aria-live={loading.state.status === "failed" ? "assertive" : "polite"}
      aria-atomic="true"
      data-timeline-window-status=""
      data-status={loading.state.status}
      {...props}
    >
      {typeof children === "function" ? children(loading) : children}
    </div>
  );
}

/**
 * Marks the end of the list of rows: render it after the last row, inside the `Viewport`. The next
 * page of the top level is asked for while it is in view, once the page before it is loaded, so
 * scrolling to the bottom loads more and a page too short to fill the viewport loads another. It
 * renders nothing visible; give it a height if the next page should be asked for early. Without
 * `resourceLoading` it renders nothing.
 */
function ListEnd({
  loading,
  ref,
  ...props
}: ComponentProps<"div"> & { loading: ResourceLoading<any> | undefined }) {
  useTimelineContext("ListEnd");
  const registered = loading?.listEnd;
  const merged = useMergedRef(ref, registered);
  if (!loading) return null;
  return (
    <div
      ref={merged}
      data-timeline-list-end=""
      data-status={loading.list.state.status}
      data-has-more={loading.list.hasMore || undefined}
      {...props}
    />
  );
}

/**
 * What the application knows about one list of resources, as a polite live region: the top level
 * (`loading.list`) or one parent's children (`loading.branch(id)`). It has `data-status`
 * (`unknown`, `pending`, `loaded`, `loaded-empty` or `failed`) and `data-has-more`, and renders
 * nothing of its own: children may be a function of the scope, for a placeholder, an error with a
 * `retry` button, or a `loadMore` button. Place it beside the rows it describes; they stay mounted.
 */
function ScopeStatus({
  scope,
  children,
  ...props
}: Omit<ComponentProps<"div">, "children"> & {
  scope: ResourceScopeLoading<any> | undefined;
  children?: ReactNode | ((scope: ResourceScopeLoading<any>) => ReactNode);
}) {
  if (!scope) return null;
  return (
    <div
      role="status"
      aria-live={scope.state.status === "failed" ? "assertive" : "polite"}
      aria-atomic="true"
      data-timeline-scope-status=""
      data-parent-id={scope.scope.parentId ?? undefined}
      data-status={scope.state.status}
      data-has-more={scope.hasMore || undefined}
      {...props}
    >
      {typeof children === "function" ? children(scope) : children}
    </div>
  );
}

/** Unstyled parts of a resource timeline; the consumer supplies every class and all content. */
export const ResourceTimeline = {
  Root,
  Viewport,
  Axis,
  AxisSlot,
  ResourceRow,
  GroupRow,
  Disclosure,
  Lane,
  Event,
  ResizeHandle,
  Preview,
  Status,
  WindowStatus,
  ListEnd,
  ScopeStatus,
};
