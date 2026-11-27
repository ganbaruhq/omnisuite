import {
  observeWindow,
  timelineWindowOf,
  windowLoadingLogic,
  windowStateOf,
  WindowObserverError,
  type Timeline,
  type TimelineWindow,
  type WindowCoverageByKey,
  type WindowObserver,
  type WindowState,
} from "@omnisuite/calendar-core";
import { useSelector, useStore } from "@xstate/store-react";
import { Cause, Effect, Exit, Scope } from "effect";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";

export interface WindowLoadingOptions<TError = unknown> {
  /**
   * What the application knows about each window, by `window.key`. A window it leaves out is
   * unknown; one it reports `loaded-empty` is known to have no events. Keep the loaded events in
   * the timeline's `events`: they stay shown while another window is pending or has failed.
   */
  readonly coverage?: WindowCoverageByKey<TError>;
  /**
   * Called after the render that needs a window, once for each window the timeline shows, and
   * again when {@link WindowLoading.retry} is used after a failure. The calendar neither fetches
   * nor caches: start or reuse a query here and return a function that stops observing it. That
   * function runs when the window changes or the timeline unmounts. A query that other consumers
   * share must outlive it; whether to abort is the application's decision.
   */
  readonly onLoadWindow?: WindowObserver;
}

/** The window the timeline needs now, and what the application knows about it. */
export interface WindowLoading<TError = unknown> {
  readonly window: TimelineWindow;
  readonly state: WindowState<TError>;
  /** Asks for the window again. It does nothing unless the window has `failed`. */
  retry(): void;
}

/**
 * Signals the window the timeline needs through `onLoadWindow`, after React has committed and
 * not while rendering. The same window is not signalled again however often the timeline
 * renders; a failed one is signalled again only by an explicit `retry`.
 */
export function useWindowLoading<TError>(
  timeline: Timeline<any, any> | undefined,
  options: WindowLoadingOptions<TError> | undefined,
): WindowLoading<TError> | undefined {
  const store = useStore(windowLoadingLogic);
  const window = useMemo(() => (timeline ? timelineWindowOf(timeline) : undefined), [timeline]);
  const key = window?.key;
  const attempt = useSelector(store, (snapshot) =>
    key === undefined ? 0 : (snapshot.context.retries[key] ?? 0),
  );
  const latest = useRef({ window, onLoadWindow: options?.onLoadWindow });
  useLayoutEffect(() => {
    latest.current = { window, onLoadWindow: options?.onLoadWindow };
  });
  // The retries already signalled, so that only the signal a click caused says `retry`.
  const signalled = useRef<Record<string, number>>({});
  const observing = options?.onLoadWindow !== undefined;

  useEffect(() => {
    const { window, onLoadWindow } = latest.current;
    if (!observing || !window || !onLoadWindow) return;
    // Coming back to a window that was once retried is not a retry.
    const retry = attempt > (signalled.current[window.key] ?? 0);
    signalled.current[window.key] = attempt;
    // The scope belongs to this effect: closing it ends only this observation.
    const scope = Effect.runSync(Scope.make());
    const exit = Effect.runSyncExit(
      observeWindow(onLoadWindow, window, { retry }).pipe(Scope.provide(scope)),
    );
    if (Exit.isFailure(exit)) {
      Effect.runSync(Scope.close(scope, exit));
      // The application's own error is reported to React as it was thrown.
      const failure = Cause.squash(exit.cause);
      throw failure instanceof WindowObserverError ? failure.cause : failure;
    }
    return () => Effect.runSync(Scope.close(scope, Exit.void));
  }, [observing, key, attempt]);

  const state = window ? windowStateOf(options?.coverage ?? {}, window) : undefined;
  const failed = state?.status === "failed";
  const retry = useCallback(() => {
    if (key !== undefined && failed) store.trigger.retryRequested({ key });
  }, [store, key, failed]);

  if (!options || !window || !state) return undefined;
  return { window, state, retry } as WindowLoading<TError>;
}
