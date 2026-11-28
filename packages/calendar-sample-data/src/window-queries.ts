import type {
  CalendarEventInput,
  TimelineWindow,
  WindowCoverage,
  WindowCoverageByKey,
} from "@omnisuite/calendar-core";
import { intersectsWindow } from "@omnisuite/calendar-core";

// The calendar never fetches, caches or retries. This file is the application's side of that
// bargain, written like a small query client: a cache keyed by window, one request per window
// however many consumers observe it, and a request that is aborted only when nobody observes it
// any more. TanStack Query, SWR or an Effect service can stand in for it; the calendar only sees
// `observe` (as `onLoadWindow`) and `coverage`.

/** Loads the events of a window. Reject with an `AbortError` or ignore `signal` to be cancelled. */
export type FetchWindow<TEvent> = (
  window: TimelineWindow,
  signal: AbortSignal,
) => Promise<readonly TEvent[]>;

export interface WindowQueriesSnapshot<TEvent> {
  /** What is known about each window, for the calendar's `loading.coverage`. */
  readonly coverage: WindowCoverageByKey;
  /** Every event loaded so far, from every window, so none disappears while another loads. */
  readonly events: readonly TEvent[];
}

export interface WindowQueries<TEvent> {
  /**
   * Starts, or joins, the query for a window, and returns a function that stops observing it.
   * Pass it to the calendar as `onLoadWindow`. A failed query is started again only on `retry`.
   */
  observe(window: TimelineWindow, context: { readonly retry: boolean }): () => void;
  /** Replaces a loaded event, such as one that the viewer has moved and the application accepted. */
  update(event: TEvent): void;
  subscribe(listener: () => void): () => void;
  getSnapshot(): WindowQueriesSnapshot<TEvent>;
}

interface Entry<TEvent> {
  coverage: WindowCoverage;
  events: readonly TEvent[];
  observers: number;
  controller: AbortController;
}

const isAbort = (error: unknown) => error instanceof DOMException && error.name === "AbortError";

export function createWindowQueries<TEvent extends { readonly id: string }>(
  fetchWindow: FetchWindow<TEvent>,
): WindowQueries<TEvent> {
  const entries = new Map<string, Entry<TEvent>>();
  const listeners = new Set<() => void>();
  let snapshot: WindowQueriesSnapshot<TEvent> = { coverage: {}, events: [] };

  const publish = () => {
    const byId = new Map<string, TEvent>();
    const coverage: Record<string, WindowCoverage> = {};
    for (const [key, entry] of entries) {
      coverage[key] = entry.coverage;
      for (const event of entry.events) byId.set(event.id, event);
    }
    snapshot = { coverage, events: [...byId.values()] };
    for (const listener of listeners) listener();
  };

  const start = (window: TimelineWindow, observers: number): Entry<TEvent> => {
    const entry: Entry<TEvent> = {
      coverage: { status: "pending" },
      events: [],
      observers,
      controller: new AbortController(),
    };
    entries.set(window.key, entry);
    // A response for an entry that was cancelled or replaced is dropped, so it can never fill a
    // window that has been asked for again.
    const isCurrent = () => entries.get(window.key) === entry && !entry.controller.signal.aborted;
    fetchWindow(window, entry.controller.signal).then(
      (events) => {
        if (!isCurrent()) return;
        entry.events = events;
        entry.coverage = { status: events.length === 0 ? "loaded-empty" : "loaded" };
        publish();
      },
      (error: unknown) => {
        if (!isCurrent() || isAbort(error)) return;
        entry.coverage = { status: "failed", error };
        publish();
      },
    );
    return entry;
  };

  return {
    observe(window, { retry }) {
      const existing = entries.get(window.key);
      const started = !existing || (retry && existing.coverage.status === "failed");
      const entry = started ? start(window, existing?.observers ?? 0) : existing;
      entry.observers += 1;
      // A cached or shared window changes nothing for anyone else.
      if (started) publish();
      let released = false;
      return () => {
        if (released) return;
        released = true;
        const current = entries.get(window.key);
        if (!current) return;
        current.observers -= 1;
        // Other observers share the request. Only the last one to leave cancels it, and a
        // cancelled request leaves no trace: it is not reported as a failure.
        if (current.observers === 0 && current.coverage.status === "pending") {
          current.controller.abort();
          entries.delete(window.key);
          publish();
        }
      };
    },
    update(event) {
      for (const entry of entries.values())
        entry.events = entry.events.map((loaded) => (loaded.id === event.id ? event : loaded));
      publish();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
  };
}

/**
 * A stand-in for a server: the events of `events` that intersect the window, including those
 * that start before it, on the resources it covers, after `delayMs`. A window whose range starts
 * at or after `failUntilRetry` fails on its first request, so that retrying can be tried.
 */
export function createSampleFetch<TEvent extends CalendarEventInput>(
  events: readonly TEvent[],
  { delayMs = 300, failUntilRetry }: { delayMs?: number; failUntilRetry?: string } = {},
): FetchWindow<TEvent> {
  const failed = new Set<string>();
  return (window, signal) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (
          failUntilRetry !== undefined &&
          window.range.start >= failUntilRetry &&
          !failed.has(window.key)
        ) {
          failed.add(window.key);
          reject(new Error("The server could not be reached."));
          return;
        }
        resolve(
          events.filter(
            (event) =>
              intersectsWindow(window, event) &&
              event.resourceIds.some((id) => window.resourceScope.includes(id)),
          ),
        );
      }, delayMs);
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
}
