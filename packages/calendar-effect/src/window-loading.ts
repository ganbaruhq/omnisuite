import {
  isWindowRetry,
  observeWindow,
  timelineWindowOf,
  type decodeTimelineResult,
  type TimelineWindow,
  type WindowCoverageByKey,
  type WindowObserver,
} from "@omnisuite/calendar-core";
import { Effect, Stream } from "effect";

/** The same options as calendar-react's `loading`. */
export interface WindowLoadingOptions<TError = unknown> {
  /**
   * What the application knows about each window, by `window.key`. A window it leaves out is
   * unknown. Keep the loaded events in the timeline's `events`: they stay shown while another
   * window is pending or has failed.
   */
  readonly coverage?: WindowCoverageByKey<TError> | undefined;
  /**
   * Called once for each window the timeline shows, and again after `retry` when it failed. The
   * calendar neither fetches nor caches: start or reuse a query here and return a function that
   * stops observing it. That function runs when the window changes or the timeline goes away.
   */
  readonly onLoadWindow?: WindowObserver | undefined;
}

/** The window a valid timeline with loading turned on needs now. */
export const windowOf = (
  result: ReturnType<typeof decodeTimelineResult>,
  loading: WindowLoadingOptions | undefined,
): TimelineWindow | undefined =>
  loading && result._tag === "Success" ? timelineWindowOf(result.success) : undefined;

/**
 * Reports that `attempt` of `window` is signalled, then observes the window until the stream is
 * interrupted. The observation is a retry only if this attempt has not been signalled before.
 * An error the observer throws is a defect, so it fails the component as it was thrown.
 */
export const loadWindow = <Msg>(options: {
  readonly window: TimelineWindow;
  readonly attempt: number;
  readonly signalled: Readonly<Record<string, number>>;
  readonly onLoadWindow: WindowObserver;
  readonly signal: (key: string, attempt: number) => Msg;
}): Stream.Stream<Msg> => {
  const { window, attempt, onLoadWindow } = options;
  const retry = isWindowRetry(options.signalled, window.key, attempt);
  return Stream.concat(
    Stream.make(options.signal(window.key, attempt)),
    Stream.unwrap(
      observeWindow(onLoadWindow, window, { retry }).pipe(
        Effect.catchTag("WindowObserverError", (error) => Effect.die(error.cause)),
        Effect.as(Stream.never),
      ),
    ),
  );
};
