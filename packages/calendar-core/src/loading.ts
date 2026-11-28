import { createStoreLogic } from "@xstate/store";
import { Data, Effect, type Scope } from "effect";
import { Temporal } from "temporal-polyfill";
import { instantOf } from "./schema.js";
import type { Timeline } from "./timeline.js";

/**
 * The part of the timeline an application is asked to load: events that intersect `range`,
 * `[start, end)`, for the resources in `resourceScope`, shown in `timeZone`. The calendar names
 * the window and nothing else; it does not say how to fetch it.
 */
export interface TimelineWindow {
  /**
   * Identifies the window by its range, time zone and resource scope. Key `coverage` by it, so
   * a response is only ever read for the window it was loaded for.
   */
  readonly key: string;
  /** Canonical UTC instants, such as `2026-10-26T00:00:00Z`, whatever zone the timeline shows. */
  readonly range: { readonly start: string; readonly end: string };
  readonly timeZone: string;
  /** The IDs of the resources whose rows the timeline shows, sorted. Groups own no events. */
  readonly resourceScope: readonly string[];
}

/**
 * What the application knows about one window. A window it has not reported is unknown, which
 * is not the same as `loaded-empty`: loaded with no events in it.
 */
export type WindowCoverage<TError = unknown> =
  | { readonly status: "pending" }
  | { readonly status: "loaded" }
  | { readonly status: "loaded-empty" }
  | { readonly status: "failed"; readonly error?: TError };

/** Coverage by {@link TimelineWindow.key}. A cancelled request is not a failure: leave it out. */
export type WindowCoverageByKey<TError = unknown> = Readonly<
  Record<string, WindowCoverage<TError>>
>;

export type WindowState<TError = unknown> = { readonly status: "unknown" } | WindowCoverage<TError>;

/** The key of a window; equal ranges, time zones and scopes give equal keys. */
function timelineWindowKey(window: Omit<TimelineWindow, "key">): string {
  return JSON.stringify([
    window.range.start,
    window.range.end,
    window.timeZone,
    window.resourceScope,
  ]);
}

/** The window a laid out timeline needs events for. */
export function timelineWindowOf(
  timeline: Pick<Timeline, "range" | "timeZone" | "rows">,
): TimelineWindow {
  const window = {
    range: { start: timeline.range.start.toString(), end: timeline.range.end.toString() },
    timeZone: timeline.timeZone,
    resourceScope: timeline.rows
      .filter((row) => row.kind === "resource")
      .map((row) => row.resource.id)
      .sort(),
  };
  return { key: timelineWindowKey(window), ...window };
}

/** What is known about a window. Coverage reported for any other window has no effect on it. */
export function windowStateOf<TError>(
  coverage: WindowCoverageByKey<TError>,
  window: Pick<TimelineWindow, "key">,
): WindowState<TError> {
  return Object.hasOwn(coverage, window.key) ? coverage[window.key]! : { status: "unknown" };
}

/**
 * Whether an interval, written like an event's endpoints, intersects the window. Use it to pick
 * what a window loads: an event that starts before the window and ends inside it belongs to it,
 * and one that only touches a boundary does not, as intervals are `[start, end)`.
 */
export function intersectsWindow(
  window: Pick<TimelineWindow, "range">,
  interval: { readonly start: string; readonly end: string },
): boolean {
  const start = instantOf(interval.start);
  const end = instantOf(interval.end);
  if (!start || !end) return false;
  return (
    Temporal.Instant.compare(start, Temporal.Instant.from(window.range.end)) < 0 &&
    Temporal.Instant.compare(end, Temporal.Instant.from(window.range.start)) > 0
  );
}

/**
 * The transient state of one calendar's window loading: how often each window was explicitly
 * retried. Coverage is not here; the application owns it and supplies it.
 */
export const windowLoadingLogic = createStoreLogic({
  context: (): { readonly retries: Readonly<Record<string, number>> } => ({ retries: {} }),
  on: {
    retryRequested: (context, event: { readonly key: string }) => ({
      retries: { ...context.retries, [event.key]: (context.retries[event.key] ?? 0) + 1 },
    }),
  },
});

/** How many times the viewer has asked for window `key` again, from `windowLoadingLogic`. */
export const windowAttemptOf = (retries: Readonly<Record<string, number>>, key: string) =>
  retries[key] ?? 0;

/**
 * Whether signalling `attempt` of window `key` is a retry, given the attempt last signalled for
 * each window. Only an attempt not signalled yet is one: coming back to a window that was once
 * retried is not a retry.
 */
export const isWindowRetry = (
  signalled: Readonly<Record<string, number>>,
  key: string,
  attempt: number,
) => attempt > (signalled[key] ?? 0);

/**
 * Called when the calendar needs a window. It may return a function that ends the calendar's
 * interest, called when the window is no longer shown or the calendar goes away. That must stop
 * observing, not abort a request that another consumer shares: whether a query is cancelled is
 * the application's decision.
 */
export type WindowObserver = (
  window: TimelineWindow,
  context: { readonly retry: boolean },
) => void | (() => void);

/** The application's {@link WindowObserver} threw. */
export class WindowObserverError extends Data.TaggedError("WindowObserverError")<{
  readonly cause: unknown;
}> {}

/**
 * Signals a window to the observer and, when the scope closes, ends the observation. Nothing
 * runs until the Effect does.
 */
export const observeWindow = (
  observer: WindowObserver,
  window: TimelineWindow,
  context: { readonly retry: boolean },
): Effect.Effect<void, WindowObserverError, Scope.Scope> =>
  Effect.acquireRelease(
    Effect.try({
      try: () => observer(window, context),
      catch: (cause) => new WindowObserverError({ cause }),
    }),
    (release) => Effect.sync(() => (typeof release === "function" ? release() : undefined)),
  ).pipe(Effect.asVoid);
