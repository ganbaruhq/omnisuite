import type {
  CalendarEventInput,
  EditingInput,
  EventProposal,
  TimelineView,
} from "@omnisuite/calendar-core";
import { useResourceTimeline } from "@omnisuite/calendar-react";
import { useCallback, useState, useSyncExternalStore } from "react";
import type { ResourceQueries, ResourceQueriesSnapshot } from "./resource-queries";
import type { SampleBoard, StayKind } from "./sample-timeline";
import type { WindowQueries, WindowQueriesSnapshot } from "./window-queries";

export type SampleEvent = CalendarEventInput<{ kind: StayKind }>;
export type SampleProposal = EventProposal<{ kind: StayKind }>;

/** What moving events does in the example; the calendar itself never changes the events. */
export interface EditingOptions {
  /** The editing options handed to the calendar. Leave them out for a read-only timeline. */
  readonly editing?: EditingInput<{ kind: StayKind }>;
  /** Called with each proposal the calendar emits. */
  readonly onProposal?: (proposal: SampleProposal) => void;
  /** Called when a rule throws. */
  readonly onRuleError?: (error: unknown) => void;
  /** Whether the example applies proposals to its events. Defaults to true; false ignores them. */
  readonly acceptProposals?: boolean;
}

/** Where the data of a board comes from: the board itself, or the application's query functions. */
export interface BoardData {
  /** The resources and events to show. The range and slot size come from the scale chosen. */
  readonly board: SampleBoard;
  /**
   * Loads events window by window as the viewer navigates, through the application's own query
   * functions. Without it `board.events` is all there is and there is nothing to navigate to.
   */
  readonly queries?: WindowQueries<SampleEvent> | undefined;
  /**
   * Loads resources as the viewer scrolls and expands, through the application's own query
   * functions. With it the rooms are what has been loaded so far, and `board.resources` is unused.
   */
  readonly resourceQueries?: ResourceQueries | undefined;
}

const noSnapshot: WindowQueriesSnapshot<SampleEvent> = { coverage: {}, events: [] };
const noResources: ResourceQueriesSnapshot = { coverage: {}, resources: [] };
const subscribeNothing = () => () => {};
const getNoSnapshot = () => noSnapshot;
const getNoResources = () => noResources;

/**
 * The application's side of one calendar, shared by every composition of it: it owns the events,
 * applies the proposals it accepts, reads what its query functions have loaded and hands them to
 * `useResourceTimeline`. A composition only decides how the result is drawn; each call owns its own
 * state, so two boards on one page never share a gesture, an expansion or a scroll position.
 */
export function useBoard(
  view: TimelineView,
  { board, queries, resourceQueries }: BoardData,
  { editing, onProposal, onRuleError, acceptProposals = true }: EditingOptions,
) {
  // The application owns the events: a proposal changes them only if it is accepted here.
  const [events, setEvents] = useState(board.events);
  // Events supplied afresh replace what the viewer has moved.
  const [supplied, setSupplied] = useState(board.events);
  if (supplied !== board.events) {
    setSupplied(board.events);
    setEvents(board.events);
  }
  // With `queries` the events are what the application has loaded so far, from every window
  // visited; a window that is pending or has failed never takes them away.
  const loaded = useSyncExternalStore(
    queries?.subscribe ?? subscribeNothing,
    queries?.getSnapshot ?? getNoSnapshot,
  );
  // With `resourceQueries` the resources are what the application has loaded so far, from every
  // page and every expanded parent.
  const loadedResources = useSyncExternalStore(
    resourceQueries?.subscribe ?? subscribeNothing,
    resourceQueries?.getSnapshot ?? getNoResources,
  );
  const accept = useCallback(
    (proposal: SampleProposal) => {
      onProposal?.(proposal);
      if (!acceptProposals) return;
      if (queries) queries.update(proposal.after);
      else
        setEvents((current) =>
          current.map((event) => (event.id === proposal.eventId ? proposal.after : event)),
        );
    },
    [onProposal, acceptProposals, queries],
  );
  return useResourceTimeline<unknown, { kind: StayKind }>({
    ...view,
    resources: resourceQueries ? loadedResources.resources : board.resources,
    events: queries ? loaded.events : events,
    editing,
    onProposal: accept,
    onRuleError,
    loading: queries && { coverage: loaded.coverage, onLoadWindow: queries.observe },
    resourceLoading: resourceQueries && {
      coverage: loadedResources.coverage,
      onLoad: resourceQueries.observe,
    },
  });
}
