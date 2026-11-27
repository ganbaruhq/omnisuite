import {
  decodeEditingResult,
  editGestureLogic,
  evaluateMove,
  evaluateResize,
  occurrenceIdOf,
  previewLayout,
  type CalendarEvent,
  type Disambiguation,
  type EditCancelReason,
  type EditEvaluation,
  type Editing,
  type EditingInput,
  type EditGesture,
  type EditOperation,
  type EditRule,
  type EventPlacement,
  type EventProposal,
  type ResizeEdge,
  type Timeline,
  type TimelineInputError,
  type TimelineRow,
} from "@omnisuite/calendar-core";
import { useSelector, useStore } from "@xstate/store-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

/** What a preview shows, for describing it to someone who cannot see it. */
export interface PreviewDescription<TEventData = unknown> {
  /** `unchanged` is the event staying where it is; `rejected` is a destination that is not allowed. */
  readonly status: "allowed" | "unchanged" | "rejected";
  /** The rule that rejected the destination. */
  readonly rule?: EditRule;
  /** What the rule threw, when it threw instead of answering. */
  readonly error?: unknown;
  readonly proposal: EventProposal<TEventData>;
  readonly title: string;
  /** The titles of the resources the event would be on. */
  readonly resourceTitles: readonly string[];
  readonly timeZone: string;
}

export interface EditorOptions<TEventData = unknown> {
  /**
   * Turns editing on. Without it the timeline is read-only. Rules are called with the latest
   * closure, so they may be written inline; the other settings are compared by value.
   */
  readonly editing?: EditingInput<TEventData>;
  /**
   * Called once when a changed, allowed destination is released or confirmed. The calendar does
   * not change the events: accept the proposal by supplying new events, or ignore it.
   */
  readonly onProposal?: (proposal: EventProposal<TEventData>) => void;
  /** Called, once per rule per gesture, when a rule throws; the destination counts as rejected. */
  readonly onRuleError?: (
    error: unknown,
    context: { readonly rule: EditRule; readonly proposal: EventProposal<TEventData> },
  ) => void;
  /** Words for the preview's accessible description. Defaults to English. */
  readonly describe?: (preview: PreviewDescription<TEventData>) => string;
}

/** The destination preview in the row it lands in. */
export interface EditorPreview {
  readonly resourceId: string;
  /** The preview in its lane, or undefined when the destination lies outside the visible range. */
  readonly placement: EventPlacement<any> | undefined;
  readonly status: PreviewDescription["status"];
  readonly rule: EditRule | undefined;
  readonly description: string;
}

/** What the parts need of the editor. Obtained from {@link useResourceTimeline}. */
export interface TimelineEditor {
  readonly gesture: EditGesture | undefined;
  /** Why the last gesture was cancelled, until another begins. */
  readonly cancellation: EditCancelReason | undefined;
  readonly preview: EditorPreview | undefined;
  /** What to announce: the destination while moving, then how the gesture ended. */
  readonly message: string;
  /** Whether the event can be edited at all: moved or resized. */
  canEdit(event: CalendarEvent<any>): boolean;
  /** Whether the event can be moved, in time or to another resource. */
  canMove(event: CalendarEvent<any>): boolean;
  /** Whether either edge of the event can be resized. */
  canResize(event: CalendarEvent<any>): boolean;
  registerRow(resourceId: string, element: HTMLElement | null): void;
  registerLane(resourceId: string, element: HTMLElement | null): void;
  registerViewport(element: HTMLElement | null): void;
  /** Whether the keyboard focus belongs on a newly mounted rendering, once. */
  takeFocus(occurrenceId: string): boolean;
  readonly pointer: {
    attach(manager: DragManager): void;
    start(eventId: string, resourceId: string, point: Point): void;
    end(canceled: boolean): void;
    /** Begins resizing an edge, followed until the pointer is released or Escape is pressed. */
    startResize(eventId: string, resourceId: string, edge: ResizeEdge, point: Point): void;
  };
  readonly keyboard: {
    start(eventId: string, resourceId: string): void;
    /** Begins resizing an edge; `step` then moves that edge. */
    startResize(eventId: string, resourceId: string, edge: ResizeEdge): void;
    step(by: number): void;
    row(by: number): void;
    confirm(): void;
    cancel(reason: EditCancelReason): void;
  };
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** The part of dnd-kit's manager that stops a drag the application has cancelled. */
export interface DragManager {
  readonly actions: { stop(args?: { canceled?: boolean }): unknown };
}

const dateFormat = (timeZone: string) =>
  new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone });

const ruleText: Record<EditRule, string> = {
  constraint: "outside the allowed times",
  overlap: "overlaps another event",
  allow: "not permitted",
};

function describeInEnglish(preview: PreviewDescription): string {
  const format = dateFormat(preview.timeZone);
  const when = `${format.format(Date.parse(preview.proposal.after.start))} to ${format.format(
    Date.parse(preview.proposal.after.end),
  )}`;
  const where = preview.resourceTitles.join(", ");
  if (preview.status === "rejected") {
    const why = preview.error !== undefined ? "a rule failed" : ruleText[preview.rule!];
    return `Not allowed: ${preview.title} on ${where}, ${when} (${why})`;
  }
  if (preview.status === "unchanged") return `${preview.title} stays on ${where}, ${when}`;
  return preview.proposal.operation === "resize"
    ? `Resize the ${preview.proposal.edge} of ${preview.title} on ${where}, ${when}`
    : `Move ${preview.title} to ${where}, ${when}`;
}

const cancelText = (operation: EditOperation, reason: EditCancelReason) => {
  const action = operation === "resize" ? "Resize" : "Move";
  switch (reason) {
    case "escape":
    case "blur":
      return `${action} cancelled.`;
    case "invalid-target":
      return `${action} cancelled: not over a resource.`;
    case "rejected":
      return `${action} cancelled: that ${operation === "resize" ? "interval" : "destination"} is not allowed.`;
    case "event-removed":
      return `${action} cancelled: the event was removed.`;
    case "event-changed":
      return `${action} cancelled: the event changed.`;
  }
};

/** Identifies an event's values, so that a change under a gesture can be told from a re-render. */
const fingerprintOf = (event: CalendarEvent<any>) =>
  JSON.stringify([
    event.id,
    event.title,
    event.start.toString(),
    event.end.toString(),
    event.resourceIds,
    event.startEditable,
    event.resourceEditable,
    event.durationEditable,
    event.constraint?.map(({ start, end, resourceIds }) => [
      start.toString(),
      end.toString(),
      resourceIds,
    ]),
    event.overlap,
  ]);

/** Identifies what an evaluation shows, so an unchanged one does not update the store. */
const evaluationKey = (evaluation: EditEvaluation<any> | undefined) => {
  if (!evaluation) return "";
  if (evaluation.status === "unavailable") return `unavailable:${evaluation.reason}`;
  const { targetResourceId, after } = evaluation.proposal;
  return JSON.stringify([
    evaluation.status,
    evaluation.status === "rejected" ? evaluation.rule : "",
    evaluation.status === "rejected" && evaluation.error !== undefined,
    targetResourceId,
    after.start,
    after.end,
    after.resourceIds,
  ]);
};

/**
 * Decodes the editing options, once per change of their values. The rules are called through the
 * latest closure, so an inline function does not make the options look new on every render.
 */
export function useEditingResult<TEventData>(
  editing: EditingInput<TEventData> | undefined,
  disambiguation: Disambiguation | undefined,
): Editing<TEventData> | TimelineInputError | undefined {
  const latest = useRef(editing);
  useLayoutEffect(() => {
    latest.current = editing;
  });
  const { snap, startEditable, resourceEditable, durationEditable } = editing ?? {};
  const constraint = JSON.stringify(editing?.constraint);
  const hasOverlap = editing?.overlap !== undefined;
  const hasAllow = editing?.allow !== undefined;
  const present = editing !== undefined;
  return useMemo(() => {
    if (!present) return undefined;
    const result = decodeEditingResult<TEventData>(
      {
        snap: snap!,
        startEditable,
        resourceEditable,
        durationEditable,
        constraint: constraint === undefined ? undefined : JSON.parse(constraint),
        overlap: hasOverlap
          ? (stationary, moving) => latest.current!.overlap!(stationary, moving)
          : undefined,
        allow: hasAllow
          ? (proposal, context) => latest.current!.allow!(proposal, context)
          : undefined,
      },
      { disambiguation },
    );
    return result._tag === "Success" ? result.success : result.failure;
  }, [
    present,
    snap,
    startEditable,
    resourceEditable,
    durationEditable,
    constraint,
    hasOverlap,
    hasAllow,
    disambiguation,
  ]);
}

interface EditorInput<TResourceData, TEventData> {
  readonly timeline: Timeline<TResourceData, TEventData> | undefined;
  readonly editing: Editing<TEventData> | undefined;
  /** The rows that are shown without any preview, in order. */
  readonly rows: readonly TimelineRow<TResourceData, TEventData>[];
  readonly options: Omit<EditorOptions<TEventData>, "editing">;
}

/**
 * One calendar's editing: its gesture store, the measuring of the rows the pointer is over, the
 * evaluation of every move and the rows laid out around the destination preview. The store holds
 * the gesture, its preview and why it was cancelled, never the events, which the application owns.
 */
export function useEditor<TResourceData, TEventData>(
  input: EditorInput<TResourceData, TEventData>,
) {
  const { timeline, editing, rows } = input;
  const store = useStore(editGestureLogic);
  const gesture = useSelector(store, (snapshot) => snapshot.context.gesture);
  const cancellation = useSelector(store, (snapshot) => snapshot.context.cancellation?.reason);
  const [outcome, setOutcome] = useState("");

  const latest = useRef(input);
  useLayoutEffect(() => {
    latest.current = input;
  });
  const lanes = useRef(new Map<string, HTMLElement>());
  const rowElements = useRef(new Map<string, HTMLElement>());
  const viewport = useRef<HTMLElement | null>(null);
  const manager = useRef<DragManager | null>(null);
  const pointer = useRef<{ startSlot: number; point: Point } | undefined>(undefined);
  // Removes the document listeners that follow a pointer resize.
  const resizeListeners = useRef<(() => void) | undefined>(undefined);
  const reported = useRef(new Set<EditRule>());
  const shown = useRef("");
  const focusAfter = useRef<string | undefined>(undefined);

  const resourceEditableOf = (event: CalendarEvent<any>) =>
    event.resourceEditable ?? latest.current.editing?.resourceEditable ?? false;
  const timeEditableOf = (event: CalendarEvent<any>) =>
    event.startEditable ?? latest.current.editing?.startEditable ?? false;
  const durationEditableOf = (event: CalendarEvent<any>) =>
    event.durationEditable ?? latest.current.editing?.durationEditable ?? false;
  // Read during render, so from the editing given now rather than from the ref.
  const canMove = useCallback(
    (event: CalendarEvent<any>) =>
      editing !== undefined &&
      ((event.startEditable ?? editing.startEditable) ||
        (event.resourceEditable ?? editing.resourceEditable)),
    [editing],
  );
  const canResize = useCallback(
    (event: CalendarEvent<any>) =>
      editing !== undefined && (event.durationEditable ?? editing.durationEditable),
    [editing],
  );
  const canEdit = useCallback(
    (event: CalendarEvent<any>) => canMove(event) || canResize(event),
    [canMove, canResize],
  );

  const eventOf = (eventId: string) =>
    latest.current.timeline?.events.find(({ id }) => id === eventId);
  const describeProposal = (
    status: PreviewDescription["status"],
    proposal: EventProposal<any>,
    rejection?: { rule: EditRule; error?: unknown },
  ) => {
    const current = latest.current;
    const titles = new Map(
      current.timeline?.rows.map(({ resource }) => [resource.id, resource.title]),
    );
    const description: PreviewDescription<any> = {
      status,
      proposal,
      title: proposal.after.title,
      resourceTitles: proposal.after.resourceIds.map((id) => titles.get(id) ?? id),
      timeZone: current.timeline?.timeZone ?? "UTC",
      ...(rejection && { rule: rejection.rule, error: rejection.error }),
    };
    return (current.options.describe ?? describeInEnglish)(description);
  };

  /** Shows what releasing the gesture now would do, and reports a rule that threw. */
  const show = (evaluation: EditEvaluation<any> | undefined) => {
    const key = evaluationKey(evaluation);
    if (evaluation?.status === "rejected" && evaluation.error !== undefined) {
      if (!reported.current.has(evaluation.rule)) {
        reported.current.add(evaluation.rule);
        latest.current.options.onRuleError?.(evaluation.error, {
          rule: evaluation.rule,
          proposal: evaluation.proposal,
        });
      }
    }
    if (key === shown.current) return;
    shown.current = key;
    store.trigger.previewChanged({
      preview:
        evaluation === undefined || evaluation.status === "unavailable"
          ? undefined
          : { targetResourceId: evaluation.proposal.targetResourceId, evaluation },
    });
  };

  const current = () => store.getSnapshot().context.gesture;

  const slotAt = (x: number, lane: HTMLElement) => {
    const box = lane.getBoundingClientRect();
    return ((x - box.left) / box.width) * (latest.current.timeline?.span ?? 1);
  };

  /** The resource row under the point, by its measured position; groups and hidden rows have none. */
  const targetAt = (point: Point) => {
    const view = viewport.current?.getBoundingClientRect();
    if (
      view &&
      (point.x < view.left || point.x >= view.right || point.y < view.top || point.y >= view.bottom)
    )
      return undefined;
    for (const [resourceId, lane] of lanes.current) {
      const box = (rowElements.current.get(resourceId) ?? lane).getBoundingClientRect();
      const across = lane.getBoundingClientRect();
      if (
        point.y >= box.top &&
        point.y < box.bottom &&
        point.x >= across.left &&
        point.x < across.right
      )
        return resourceId;
    }
    return undefined;
  };

  const evaluatePointer = (point: Point): EditEvaluation<any> | undefined => {
    const active = current();
    const start = pointer.current;
    if (!active || !start) return undefined;
    start.point = point;
    const lane = lanes.current.get(active.sourceResourceId);
    if (active.operation === "resize") {
      // An edge follows the pointer along the time axis wherever the pointer is vertically.
      const evaluation =
        lane && active.edge
          ? evaluateResize(latest.current.timeline!, latest.current.editing, {
              eventId: active.eventId,
              resourceId: active.sourceResourceId,
              edge: active.edge,
              shift: { slots: slotAt(point.x, lane) - start.startSlot },
            })
          : undefined;
      show(evaluation);
      return evaluation;
    }
    const target = targetAt(point);
    const evaluation =
      lane && target
        ? evaluateMove(latest.current.timeline!, latest.current.editing, {
            eventId: active.eventId,
            sourceResourceId: active.sourceResourceId,
            targetResourceId: target,
            shift: { slots: slotAt(point.x, lane) - start.startSlot },
          })
        : undefined;
    if (target && target !== active.targetResourceId)
      store.trigger.retargeted({ resourceId: target });
    show(evaluation);
    return evaluation;
  };

  const evaluateKeyboard = (): EditEvaluation<any> | undefined => {
    const active = current();
    if (!active) return undefined;
    const shift = active.steps !== 0 ? { steps: active.steps } : undefined;
    const evaluation =
      active.operation === "resize" && active.edge
        ? evaluateResize(latest.current.timeline!, latest.current.editing, {
            eventId: active.eventId,
            resourceId: active.sourceResourceId,
            edge: active.edge,
            ...(shift && { shift }),
          })
        : evaluateMove(latest.current.timeline!, latest.current.editing, {
            eventId: active.eventId,
            sourceResourceId: active.sourceResourceId,
            targetResourceId: active.targetResourceId,
            ...(shift && { shift }),
          });
    show(evaluation);
    return evaluation;
  };

  const reevaluate = () => {
    const active = current();
    if (!active) return;
    if (active.input === "keyboard") evaluateKeyboard();
    else if (pointer.current) evaluatePointer(pointer.current.point);
  };

  const finish = () => {
    pointer.current = undefined;
    shown.current = "";
    resizeListeners.current?.();
    resizeListeners.current = undefined;
  };

  const cancel = (reason: EditCancelReason, stopDrag = true) => {
    const active = current();
    if (!active) return;
    store.trigger.gestureCanceled({ reason });
    setOutcome(cancelText(active.operation, reason));
    finish();
    // Only a move is a drag of dnd-kit's; a resize follows the pointer itself.
    if (stopDrag && active.input === "pointer" && active.operation === "move")
      manager.current?.actions.stop({ canceled: true });
  };

  /** Ends the gesture on what it would do: emit an allowed change, cancel anything else. */
  const settle = (evaluation: EditEvaluation<any> | undefined, stopDrag: boolean) => {
    const active = current();
    if (!active) return;
    if (evaluation === undefined || evaluation.status === "unavailable")
      return cancel("invalid-target", stopDrag);
    if (evaluation.status === "rejected") return cancel("rejected", stopDrag);
    store.trigger.gestureEnded();
    finish();
    if (evaluation.status === "unchanged") {
      setOutcome(
        `${evaluation.proposal.after.title} was not ${active.operation === "resize" ? "resized" : "moved"}.`,
      );
      return;
    }
    setOutcome(describeProposal("allowed", evaluation.proposal));
    if (active.input === "keyboard") {
      focusAfter.current = occurrenceIdOf(active.eventId, evaluation.proposal.targetResourceId);
      requestAnimationFrame(() => (focusAfter.current = undefined));
    }
    latest.current.options.onProposal?.(evaluation.proposal);
  };

  const begin = (
    input: "pointer" | "keyboard",
    operation: EditOperation,
    eventId: string,
    resourceId: string,
    edge?: ResizeEdge,
  ) => {
    const event = eventOf(eventId);
    if (current() || !event) return false;
    const allowed =
      operation === "resize"
        ? durationEditableOf(event)
        : timeEditableOf(event) || resourceEditableOf(event);
    if (!allowed) return false;
    store.trigger.gestureStarted({
      input,
      operation,
      ...(edge && { edge }),
      eventId,
      sourceResourceId: resourceId,
      fingerprint: fingerprintOf(event),
    });
    reported.current.clear();
    shown.current = "";
    setOutcome("");
    return true;
  };

  const editor = useMemo<
    Pick<
      TimelineEditor,
      "registerRow" | "registerLane" | "registerViewport" | "takeFocus" | "pointer" | "keyboard"
    >
  >(
    () => ({
      registerRow: (resourceId, element) => {
        if (element) rowElements.current.set(resourceId, element);
        else rowElements.current.delete(resourceId);
      },
      registerLane: (resourceId, element) => {
        if (element) lanes.current.set(resourceId, element);
        else lanes.current.delete(resourceId);
      },
      registerViewport: (element) => {
        viewport.current = element;
      },
      takeFocus: (occurrenceId) => {
        const wanted = focusAfter.current === occurrenceId;
        if (wanted) focusAfter.current = undefined;
        return wanted;
      },
      pointer: {
        attach: (dragManager) => {
          manager.current = dragManager;
        },
        start: (eventId, resourceId, point) => {
          if (!begin("pointer", "move", eventId, resourceId)) {
            manager.current?.actions.stop({ canceled: true });
            return;
          }
          const lane = lanes.current.get(resourceId);
          pointer.current = { startSlot: lane ? slotAt(point.x, lane) : 0, point };
          evaluatePointer(point);
        },
        startResize: (eventId, resourceId, edge, point) => {
          if (!begin("pointer", "resize", eventId, resourceId, edge)) return;
          const lane = lanes.current.get(resourceId);
          pointer.current = { startSlot: lane ? slotAt(point.x, lane) : 0, point };
          evaluatePointer(point);
          // The gesture is followed on the document, so it goes on wherever the pointer is.
          const onMove = (event: PointerEvent) =>
            evaluatePointer({ x: event.clientX, y: event.clientY });
          const onUp = (event: PointerEvent) =>
            settle(evaluatePointer({ x: event.clientX, y: event.clientY }), false);
          const onCancel = () => cancel("escape", false);
          const onKey = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            cancel("escape", false);
          };
          const onScroll = () => {
            if (pointer.current) evaluatePointer(pointer.current.point);
          };
          document.addEventListener("pointermove", onMove, true);
          document.addEventListener("pointerup", onUp, true);
          document.addEventListener("pointercancel", onCancel, true);
          document.addEventListener("keydown", onKey, true);
          document.addEventListener("scroll", onScroll, true);
          resizeListeners.current = () => {
            document.removeEventListener("pointermove", onMove, true);
            document.removeEventListener("pointerup", onUp, true);
            document.removeEventListener("pointercancel", onCancel, true);
            document.removeEventListener("keydown", onKey, true);
            document.removeEventListener("scroll", onScroll, true);
          };
        },
        end: (canceled) => {
          const active = current();
          const last = pointer.current;
          if (!active) return;
          if (canceled || !last) cancel("escape", false);
          else settle(evaluatePointer(last.point), false);
        },
      },
      keyboard: {
        start: (eventId, resourceId) => {
          if (begin("keyboard", "move", eventId, resourceId)) evaluateKeyboard();
        },
        startResize: (eventId, resourceId, edge) => {
          if (begin("keyboard", "resize", eventId, resourceId, edge)) evaluateKeyboard();
        },
        step: (by) => {
          const active = current();
          const event = active && eventOf(active.eventId);
          if (!active || !event) return;
          if (!(active.operation === "resize" ? durationEditableOf(event) : timeEditableOf(event)))
            return;
          store.trigger.stepped({ by });
          evaluateKeyboard();
        },
        row: (by) => {
          const active = current();
          const event = active && eventOf(active.eventId);
          if (!active || active.operation !== "move" || !event || !resourceEditableOf(event))
            return;
          const ids = latest.current.rows.flatMap((row) =>
            row.kind === "resource" ? [row.resource.id] : [],
          );
          const at = ids.indexOf(active.targetResourceId);
          const next = ids[at + by];
          if (at < 0 || next === undefined) return;
          store.trigger.retargeted({ resourceId: next });
          evaluateKeyboard();
        },
        confirm: () => {
          // Worked out again, so that what is emitted is what the events are now.
          if (current()?.input === "keyboard") settle(evaluateKeyboard(), false);
        },
        cancel: (reason) => {
          if (current()?.input === "keyboard") cancel(reason, false);
        },
      },
    }),
    // The functions read everything through refs and the store, so they never change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Unmounting during a pointer resize must leave no listener on the document behind.
  useEffect(
    () => () => {
      resizeListeners.current?.();
      resizeListeners.current = undefined;
    },
    [],
  );

  // A change to the events or the rules under a gesture cancels it when the dragged event is gone
  // or different, and otherwise shows what the gesture does now.
  useEffect(() => {
    const active = current();
    if (!active) return;
    // Without editing, or without a valid timeline, there is nothing left to propose against.
    if (!latest.current.editing) return cancel("event-changed");
    const event = eventOf(active.eventId);
    if (!event) return cancel("event-removed");
    if (fingerprintOf(event) !== active.fingerprint) return cancel("event-changed");
    reevaluate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeline, editing]);

  // While dragging, the pointer is followed here rather than through dnd-kit, whose coordinates
  // are in the top window and not the frame this page may be in. Scrolling moves the rows under
  // a still pointer, so the destination is worked out again then too.
  const pointerDragging = gesture?.input === "pointer" && gesture.operation === "move";
  useEffect(() => {
    if (!pointerDragging) return;
    const onMove = (event: PointerEvent) => evaluatePointer({ x: event.clientX, y: event.clientY });
    const onScroll = () => {
      if (pointer.current) evaluatePointer(pointer.current.point);
    };
    document.addEventListener("pointermove", onMove, true);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointermove", onMove, true);
      document.removeEventListener("scroll", onScroll, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointerDragging]);

  const layout = useMemo(
    () =>
      timeline && gesture?.preview
        ? previewLayout(timeline, gesture.preview.evaluation.proposal as EventProposal<TEventData>)
        : undefined,
    [timeline, gesture?.preview],
  );

  /** The rows with the target row laid out around the preview, the dragged rendering kept hidden. */
  const shownRows = useMemo(() => {
    if (!gesture || !layout) return rows;
    return rows.map((row) => {
      if (row.kind !== "resource" || row.resource.id !== layout.resourceId) return row;
      const original =
        gesture.sourceResourceId === row.resource.id
          ? row.placements.filter(({ occurrenceId }) => occurrenceId === gesture.occurrenceId)
          : [];
      return {
        ...row,
        laneCount: layout.laneCount,
        placements: [...layout.placements, ...original],
      };
    });
  }, [rows, gesture, layout]);

  const preview = useMemo<EditorPreview | undefined>(() => {
    const evaluation = gesture?.preview?.evaluation;
    if (!layout || !evaluation) return undefined;
    const rejection =
      evaluation.status === "rejected"
        ? { rule: evaluation.rule, error: evaluation.error }
        : undefined;
    return {
      resourceId: layout.resourceId,
      placement: layout.preview,
      status: evaluation.status,
      rule: rejection?.rule,
      description: describeProposal(evaluation.status, evaluation.proposal, rejection),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, gesture?.preview]);

  const message = gesture
    ? (preview?.description ??
      `${gesture.operation === "resize" ? "Resizing" : "Moving"} ${eventOf(gesture.eventId)?.title ?? ""}: not over a resource.`)
    : outcome;

  const value = useMemo<TimelineEditor | undefined>(
    () =>
      editing
        ? { ...editor, canEdit, canMove, canResize, gesture, cancellation, preview, message }
        : undefined,
    [editing, editor, canEdit, canMove, canResize, gesture, cancellation, preview, message],
  );
  return { editor: value, rows: shownRows };
}
