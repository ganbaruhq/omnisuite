import { Effect, Exit, Result, Scope } from "effect";
import { describe, expect, it } from "vite-plus/test";
import {
  decodeTimelineResult,
  intersectsWindow,
  observeWindow,
  timelineWindowOf,
  windowLoadingLogic,
  windowStateOf,
  WindowObserverError,
  type TimelineWindow,
} from "./index.js";

const resources = [
  { id: "building", title: "Building", kind: "group" as const },
  { id: "room-b", title: "Room B", parentId: "building" },
  { id: "room-a", title: "Room A", parentId: "building" },
];

const windowOf = (
  overrides: {
    start?: string;
    end?: string;
    timeZone?: string;
    resources?: readonly { id: string; title: string; kind?: "group"; parentId?: string }[];
  } = {},
) => {
  const timeline = decodeTimelineResult({
    range: {
      start: overrides.start ?? "2026-10-26T00:00Z",
      end: overrides.end ?? "2026-11-02T00:00Z",
    },
    slotDuration: "P1D",
    timeZone: overrides.timeZone,
    resources: overrides.resources ?? resources,
    events: [],
  });
  if (Result.isFailure(timeline)) throw new Error(timeline.failure.message);
  return timelineWindowOf(timeline.success);
};

describe("timelineWindowOf", () => {
  it("names the date range, the time zone and the resources it covers", () => {
    const window = windowOf({
      timeZone: "Asia/Ho_Chi_Minh",
      start: "2026-10-26T00:00+07:00",
      end: "2026-11-02T00:00+07:00",
    });

    // The range is written as instants, so the same window reads the same in any zone.
    expect(window.range).toEqual({ start: "2026-10-25T17:00:00Z", end: "2026-11-01T17:00:00Z" });
    expect(window.timeZone).toBe("Asia/Ho_Chi_Minh");
    // Groups are not event targets, so they are not part of the scope.
    expect(window.resourceScope).toEqual(["room-a", "room-b"]);
  });

  it("has a key that does not depend on the order resources were supplied in", () => {
    const rooms = resources.filter((resource) => resource.kind !== "group");
    const flat = rooms.map(({ id, title }) => ({ id, title }));

    expect(windowOf({ resources: [...flat].reverse() }).key).toBe(
      windowOf({ resources: flat }).key,
    );
  });

  it.each([
    ["range", { end: "2026-11-09T00:00Z" }],
    ["time zone", { timeZone: "America/New_York" }],
    ["resource scope", { resources: resources.slice(0, 2) }],
  ])("has a different key when the %s differs", (_name, overrides) => {
    expect(windowOf(overrides).key).not.toBe(windowOf().key);
  });
});

describe("windowStateOf", () => {
  const window = windowOf();
  const other = windowOf({ start: "2026-11-02T00:00Z", end: "2026-11-09T00:00Z" });

  it("is unknown until the application reports the window", () => {
    expect(windowStateOf({}, window)).toEqual({ status: "unknown" });
  });

  it.each([
    [{ status: "loaded-empty" }],
    [{ status: "failed", error: new Error("offline") }],
  ] as const)("reports %j for the window it is keyed by", (coverage) => {
    expect(windowStateOf({ [window.key]: coverage }, window)).toEqual(coverage);
  });

  it("tells a loaded-empty window from an unknown one", () => {
    const coverage = { [window.key]: { status: "loaded-empty" } } as const;

    expect(windowStateOf(coverage, window).status).toBe("loaded-empty");
    expect(windowStateOf(coverage, other).status).toBe("unknown");
  });

  it("ignores a late response that is keyed by another window", () => {
    const coverage = {
      [window.key]: { status: "pending" },
      [other.key]: { status: "loaded" },
    } as const;

    expect(windowStateOf(coverage, window).status).toBe("pending");
    expect(windowStateOf(coverage, other).status).toBe("loaded");
  });
});

describe("intersectsWindow", () => {
  const window = windowOf();

  it.each([
    ["inside the window", "2026-10-27T09:00Z", "2026-10-27T10:00Z", true],
    ["starting before it and ending inside", "2026-10-24T14:00Z", "2026-10-27T12:00Z", true],
    ["starting inside it and ending after", "2026-10-31T14:00Z", "2026-11-04T12:00Z", true],
    ["spanning the whole window", "2026-10-20T00:00Z", "2026-11-20T00:00Z", true],
    ["ending as the window starts", "2026-10-25T00:00Z", "2026-10-26T00:00Z", false],
    ["starting as the window ends", "2026-11-02T00:00Z", "2026-11-03T00:00Z", false],
  ])("is %s", (_name, start, end, expected) => {
    expect(intersectsWindow(window, { start, end })).toBe(expected);
  });

  it("reads endpoints written with an offset or a named zone", () => {
    expect(
      intersectsWindow(window, {
        start: "2026-10-25T20:00-04:00",
        end: "2026-10-26T08:00[Asia/Ho_Chi_Minh]",
      }),
    ).toBe(true);
    expect(
      intersectsWindow(window, {
        start: "2026-10-25T07:00[Asia/Ho_Chi_Minh]",
        end: "2026-10-26T06:59+07:00",
      }),
    ).toBe(false);
  });

  it("does not match an endpoint that names no instant", () => {
    expect(intersectsWindow(window, { start: "2026-10-27", end: "2026-10-28" })).toBe(false);
  });
});

describe("windowLoadingLogic", () => {
  it("counts explicit retries for each window separately", () => {
    const store = windowLoadingLogic.createStore();

    store.trigger.retryRequested({ key: "a" });
    store.trigger.retryRequested({ key: "a" });
    store.trigger.retryRequested({ key: "b" });

    expect(store.getSnapshot().context.retries).toEqual({ a: 2, b: 1 });
  });
});

describe("observeWindow", () => {
  const window: TimelineWindow = windowOf();

  it("does nothing until the Effect runs, and then hands the window to the observer", () => {
    const seen: { window: TimelineWindow; retry: boolean }[] = [];
    const observation = observeWindow(
      (requested, context) => void seen.push({ window: requested, ...context }),
      window,
      { retry: false },
    );
    expect(seen).toEqual([]);

    Effect.runSync(Effect.scoped(observation));

    expect(seen).toEqual([{ window, retry: false }]);
  });

  it("tells the observer when the signal is an explicit retry", () => {
    const seen: boolean[] = [];

    Effect.runSync(
      Effect.scoped(
        observeWindow((_window, { retry }) => void seen.push(retry), window, { retry: true }),
      ),
    );

    expect(seen).toEqual([true]);
  });

  it("releases only the observation when the scope closes", () => {
    const events: string[] = [];
    const scope = Effect.runSync(Scope.make());

    Effect.runSync(
      observeWindow(
        () => {
          events.push("observed");
          return () => events.push("released");
        },
        window,
        { retry: false },
      ).pipe(Scope.provide(scope)),
    );
    expect(events).toEqual(["observed"]);

    Effect.runSync(Scope.close(scope, Exit.void));
    expect(events).toEqual(["observed", "released"]);
  });

  it("fails with a typed error that keeps the cause when the observer throws", () => {
    const cause = new Error("no client");

    const error = Effect.runSync(
      Effect.flip(
        Effect.scoped(
          observeWindow(
            () => {
              throw cause;
            },
            window,
            { retry: false },
          ),
        ),
      ),
    );

    expect(error).toBeInstanceOf(WindowObserverError);
    expect(error.cause).toBe(cause);
  });
});
