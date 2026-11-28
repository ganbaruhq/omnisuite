import { Mount, UiSchema } from "@effect/ui";
import {
  Accessibility,
  DragDropManager,
  Draggable,
  Feedback,
  PointerActivationConstraints,
  PointerSensor,
} from "@dnd-kit/dom";
import {
  evaluateMove,
  evaluateResize,
  type EditEvaluation,
  type EditGesture,
} from "@omnisuite/calendar-core";
import { Effect, Queue, Schema, Stream } from "effect";
import {
  beginGesture,
  cancelGesture,
  retargetGesture,
  settleGesture,
  showEvaluation,
  type EditorContext,
  type EditorState,
  type EditorStep,
} from "./editor.js";

// Pointer editing, as calendar-react does it: a move is a dnd-kit drag that begins after the
// pointer is held on an event, and a resize begins at once on a resize handle. The mount on the
// root measures the DOM and reports facts in slot units; `applyPointerFact` turns them into the
// gesture through the editor, with no DOM.

const edges = ["start", "end"] as const;

/** What the pointer did, measured: `slot` is its position along the time axis, in slots. */
export const PointerFact = UiSchema.TaggedEnum({
  /** A move was picked up, or a resize handle pressed, on an occurrence. */
  Pressed: {
    operation: Schema.Literals(["move", "resize"]),
    edge: Schema.optional(Schema.Literals(edges)),
    eventId: Schema.String,
    resourceId: Schema.String,
    slot: Schema.Number,
    /** The resource row under the pointer, if any. */
    targetResourceId: Schema.NullOr(Schema.String),
  },
  Moved: { slot: Schema.Number, targetResourceId: Schema.NullOr(Schema.String) },
  /** The pointer was released; `canceled` by Escape or by the browser. */
  Released: { canceled: Schema.Boolean },
});
export type PointerFact = typeof PointerFact.Type;

/** Where the pointer is during a pointer gesture, and where it began. */
export const PointerPosition = Schema.Struct({
  startSlot: Schema.Number,
  slot: Schema.Number,
  targetResourceId: Schema.NullOr(Schema.String),
});
export type PointerPosition = typeof PointerPosition.Type;

/** An editor state with the pointer's position, for the length of a pointer gesture. */
export interface PointerState extends EditorState {
  readonly pointer: PointerPosition | null;
}

/** What releasing the pointer at `pointer` would do; undefined while it is over no resource. */
export function evaluatePointer(
  context: EditorContext,
  gesture: EditGesture,
  pointer: PointerPosition,
): EditEvaluation<any> | undefined {
  const shift = { slots: pointer.slot - pointer.startSlot };
  // An edge follows the pointer along the time axis wherever the pointer is vertically.
  if (gesture.operation === "resize")
    return gesture.edge
      ? evaluateResize(context.timeline, context.editing, {
          eventId: gesture.eventId,
          resourceId: gesture.sourceResourceId,
          edge: gesture.edge,
          shift,
        })
      : undefined;
  return pointer.targetResourceId === null
    ? undefined
    : evaluateMove(context.timeline, context.editing, {
        eventId: gesture.eventId,
        sourceResourceId: gesture.sourceResourceId,
        targetResourceId: pointer.targetResourceId,
        shift,
      });
}

const showAt = <S extends PointerState>(
  state: S,
  context: EditorContext,
  pointer: PointerPosition,
): EditorStep<S> => {
  let next: S = { ...state, pointer };
  if (!next.gesture) return { state: next, notices: [] };
  if (next.gesture.operation === "move" && pointer.targetResourceId !== null)
    next = retargetGesture(next, pointer.targetResourceId);
  return showEvaluation(next, evaluatePointer(context, next.gesture!, pointer));
};

/** Shows the pointer gesture again where the pointer is, as after the props changed. */
export const reevaluatePointer = <S extends PointerState>(
  state: S,
  context: EditorContext,
): EditorStep<S> =>
  state.gesture?.input === "pointer" && state.pointer
    ? showAt(state, context, state.pointer)
    : { state, notices: [] };

/** The next state after a fact the pointer mount reported. */
export function applyPointerFact<S extends PointerState>(
  state: S,
  context: EditorContext,
  fact: PointerFact,
): EditorStep<S> {
  const ignored = { state, notices: [] };
  switch (fact._tag) {
    case "Pressed": {
      const begun = beginGesture(state, context, {
        input: "pointer",
        operation: fact.operation,
        eventId: fact.eventId,
        resourceId: fact.resourceId,
        edge: fact.edge,
      });
      if (!begun) return ignored;
      return showAt(begun, context, {
        startSlot: fact.slot,
        slot: fact.slot,
        targetResourceId: fact.targetResourceId,
      });
    }
    case "Moved":
      return state.gesture?.input === "pointer" && state.pointer
        ? showAt(state, context, {
            ...state.pointer,
            slot: fact.slot,
            targetResourceId: fact.targetResourceId,
          })
        : ignored;
    case "Released": {
      const { gesture, pointer } = state;
      if (gesture?.input !== "pointer") return ignored;
      if (fact.canceled || !pointer)
        return { state: { ...cancelGesture(state, "escape"), pointer: null }, notices: [] };
      const settled = settleGesture(state, context, evaluatePointer(context, gesture, pointer));
      return { ...settled, state: { ...settled.state, pointer: null } };
    }
  }
}

// ---------------------------------------------------------------------------
// The DOM side: one mount on the root
// ---------------------------------------------------------------------------

interface Point {
  readonly x: number;
  readonly y: number;
}

// A drag begins after the pointer has been held in place, as in calendar-react.
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

const rowOf = (element: Element) =>
  element.closest<HTMLElement>("[data-timeline-row][data-resource-id]");

/**
 * Follows the pointer over one timeline. The root's events with `data-movable` are dnd-kit
 * draggables, kept in step with the DOM; a press on a `data-timeline-resize-handle` starts a
 * resize. While a gesture is followed, its position is measured against the lanes, in slots of
 * the timeline's `span`, and against the rows under the pointer inside the viewport.
 *
 * `source` is the row of the pointer gesture the editor follows, or null. When it goes back to
 * null under a gesture the editor ended, such as for an event that changed, the drag stops.
 */
export const TimelinePointer = Mount.makeStream(
  "TimelinePointer",
  { args: { span: Schema.Number, source: Schema.NullOr(Schema.String) } },
  (node: HTMLElement, args, changes) =>
    Stream.callback<PointerFact>((queue) =>
      Effect.gen(function* () {
        const document = node.ownerDocument;
        let span = args.span;
        // The gesture followed here, from the press until the release.
        let following:
          | {
              readonly operation: "move" | "resize";
              readonly sourceResourceId: string;
              point: Point;
              /** Whether the editor has taken the gesture up, so a null `source` ends it. */
              taken: boolean;
            }
          | undefined;
        let stopFollowing: (() => void) | undefined;
        const offer = (fact: PointerFact) => Queue.offerUnsafe(queue, fact);

        const lanes = () =>
          Array.from(node.querySelectorAll<HTMLElement>("[data-timeline-lane]")).flatMap((lane) => {
            const row = rowOf(lane);
            return row ? [{ lane, row, resourceId: row.dataset.resourceId! }] : [];
          });
        const slotAt = (x: number, resourceId: string) => {
          const lane = lanes().find((entry) => entry.resourceId === resourceId)?.lane;
          if (!lane) return 0;
          const box = lane.getBoundingClientRect();
          return box.width === 0 ? 0 : ((x - box.left) / box.width) * span;
        };
        // The resource row under the point, by its measured position; groups have none.
        const targetAt = (point: Point) => {
          const view = node.querySelector("[data-timeline-viewport]")?.getBoundingClientRect();
          if (
            view &&
            (point.x < view.left ||
              point.x >= view.right ||
              point.y < view.top ||
              point.y >= view.bottom)
          )
            return null;
          for (const { lane, row, resourceId } of lanes()) {
            const box = row.getBoundingClientRect();
            const across = lane.getBoundingClientRect();
            if (
              point.y >= box.top &&
              point.y < box.bottom &&
              point.x >= across.left &&
              point.x < across.right
            )
              return resourceId;
          }
          return null;
        };
        const measure = (point: Point) => {
          if (!following) return;
          following.point = point;
          offer(
            PointerFact.Moved({
              slot: slotAt(point.x, following.sourceResourceId),
              targetResourceId: targetAt(point),
            }),
          );
        };
        const press = (
          operation: "move" | "resize",
          element: Element,
          point: Point,
          edge?: "start" | "end",
        ) => {
          const eventId = element.getAttribute("data-event-id");
          const resourceId = element.parentElement && rowOf(element)?.dataset.resourceId;
          if (!eventId || !resourceId) return false;
          following = { operation, sourceResourceId: resourceId, point, taken: false };
          offer(
            PointerFact.Pressed({
              operation,
              ...(edge && { edge }),
              eventId,
              resourceId,
              slot: slotAt(point.x, resourceId),
              targetResourceId: targetAt(point),
            }),
          );
          return true;
        };
        // While a gesture is followed, the pointer is followed on the document, so it goes on
        // wherever the pointer is. Scrolling moves the rows under a still pointer.
        const follow = (extra: () => () => void) => {
          const onMove = (event: PointerEvent) => measure({ x: event.clientX, y: event.clientY });
          const onScroll = () => following && measure(following.point);
          document.addEventListener("pointermove", onMove, true);
          document.addEventListener("scroll", onScroll, true);
          const removeExtra = extra();
          stopFollowing = () => {
            document.removeEventListener("pointermove", onMove, true);
            document.removeEventListener("scroll", onScroll, true);
            removeExtra();
          };
        };
        const end = (canceled: boolean) => {
          if (!following) return;
          if (!canceled) measure(following.point);
          following = undefined;
          stopFollowing?.();
          stopFollowing = undefined;
          offer(PointerFact.Released({ canceled }));
        };

        // Moves: dnd-kit, without its floating clone and its announcements, which the calendar
        // draws itself.
        const manager = yield* Effect.acquireRelease(
          Effect.sync(
            () =>
              new DragDropManager({
                sensors,
                plugins: (defaults) =>
                  defaults.filter((plugin) => plugin !== Feedback && plugin !== Accessibility),
              }),
          ),
          (manager) => Effect.sync(() => manager.destroy()),
        );
        manager.monitor.addEventListener("dragstart", (event) => {
          const element = event.operation.source?.element;
          const activator = event.operation.activatorEvent;
          const point =
            activator && "clientX" in activator
              ? { x: (activator as PointerEvent).clientX, y: (activator as PointerEvent).clientY }
              : undefined;
          if (!element || !point || following) return;
          if (press("move", element, point)) follow(() => () => {});
        });
        manager.monitor.addEventListener("dragend", (event) => {
          if (following?.operation === "move") end(event.canceled);
        });

        const draggables = new Map<Element, Draggable>();
        const sync = () => {
          const movable = new Set(
            node.querySelectorAll("[data-timeline-event][data-movable][data-occurrence-id]"),
          );
          for (const [element, draggable] of draggables)
            if (!movable.has(element) || !element.isConnected) {
              draggable.destroy();
              draggables.delete(element);
            }
          for (const element of movable)
            if (!draggables.has(element))
              draggables.set(
                element,
                new Draggable(
                  { id: element.getAttribute("data-occurrence-id")!, element },
                  manager,
                ),
              );
        };
        const observer = new MutationObserver(sync);

        // Resizes: a press on a handle resizes at once, followed until the release or Escape.
        const onPointerDown = (event: PointerEvent) => {
          if (following || event.defaultPrevented || !event.isPrimary || event.button !== 0) return;
          const handle =
            event.target instanceof Element
              ? event.target.closest<HTMLElement>("[data-timeline-resize-handle]")
              : null;
          const element = handle?.closest("[data-timeline-event]");
          const edge = handle?.dataset.edge;
          if (!handle || !element || !node.contains(handle) || (edge !== "start" && edge !== "end"))
            return;
          // No text selection, and no native drag, while the edge is followed.
          event.preventDefault();
          if (!press("resize", element, { x: event.clientX, y: event.clientY }, edge)) return;
          follow(() => {
            const onUp = (up: PointerEvent) => {
              if (following) following.point = { x: up.clientX, y: up.clientY };
              end(false);
            };
            const onCancel = () => end(true);
            const onKey = (key: KeyboardEvent) => {
              if (key.key !== "Escape") return;
              key.preventDefault();
              end(true);
            };
            document.addEventListener("pointerup", onUp, true);
            document.addEventListener("pointercancel", onCancel, true);
            document.addEventListener("keydown", onKey, true);
            return () => {
              document.removeEventListener("pointerup", onUp, true);
              document.removeEventListener("pointercancel", onCancel, true);
              document.removeEventListener("keydown", onKey, true);
            };
          });
        };

        yield* Effect.acquireRelease(
          Effect.sync(() => {
            sync();
            observer.observe(node, {
              subtree: true,
              childList: true,
              attributes: true,
              attributeFilter: ["data-movable", "data-occurrence-id"],
            });
            node.addEventListener("pointerdown", onPointerDown);
          }),
          () =>
            Effect.sync(() => {
              observer.disconnect();
              node.removeEventListener("pointerdown", onPointerDown);
              stopFollowing?.();
              stopFollowing = undefined;
              following = undefined;
              for (const draggable of draggables.values()) draggable.destroy();
              draggables.clear();
            }),
        );

        yield* Stream.runForEach(changes, (next) =>
          Effect.sync(() => {
            span = next.span;
            if (!following) return;
            if (next.source !== null) {
              following.taken = true;
              return;
            }
            if (!following.taken) return;
            // The editor ended the gesture itself: let go without reporting a release.
            const wasMove = following.operation === "move";
            following = undefined;
            stopFollowing?.();
            stopFollowing = undefined;
            if (wasMove) manager.actions.stop({ canceled: true });
          }),
        ).pipe(Effect.forkScoped);
      }),
    ),
);
