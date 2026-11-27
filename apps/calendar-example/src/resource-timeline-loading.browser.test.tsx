import type { CalendarEventInput, TimelineWindow } from "@omnisuite/calendar-core";
import { ResourceTimeline, useResourceTimeline } from "@omnisuite/calendar-react";
import { act, Component, StrictMode, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { page } from "vite-plus/test/browser";
import { ResourceTimelineExample } from "./resource-timeline-example";
import { flatTimeline, type StayKind } from "./sample-timeline";
import { createWindowQueries, type FetchWindow } from "./window-queries";
import "./styles.css";

type SampleEvent = CalendarEventInput<{ kind: StayKind }>;

const roots: { root: Root; container: HTMLElement }[] = [];

async function render(node: ReactNode) {
  const container = document.body.appendChild(document.createElement("div"));
  const root = createRoot(container);
  roots.push({ root, container });
  await act(async () => root.render(node));
  return { root, container };
}

afterEach(async () => {
  for (const { root, container } of roots.splice(0)) {
    await act(async () => root.unmount());
    container.remove();
  }
});

/** A fetch that answers only when the test says so, in the order the test chooses. */
function controlledFetch() {
  const calls: {
    window: TimelineWindow;
    signal: AbortSignal;
    resolve(events: readonly SampleEvent[]): Promise<void>;
    reject(error: unknown): Promise<void>;
  }[] = [];
  const fetchWindow: FetchWindow<SampleEvent> = (window, signal) =>
    new Promise((resolve, reject) => {
      calls.push({
        window,
        signal,
        resolve: (events) => act(async () => resolve(events)),
        reject: (error) => act(async () => reject(error)),
      });
    });
  return { calls, queries: createWindowQueries(fetchWindow) };
}

const event = (id: string) => flatTimeline.events.find((candidate) => candidate.id === id)!;
const shown = (id: string) => document.querySelector<HTMLElement>(`[data-event-id="${id}"]`);
const windowStatus = () =>
  document.querySelector<HTMLElement>("[data-timeline-window-status]")?.dataset.status;
const click = (name: string) =>
  act(async () => {
    (page.getByRole("button", { name, exact: true }).element() as HTMLElement).click();
  });

describe("loading windows through application-owned queries", () => {
  it("asks for the shown window, naming its range, time zone and resource scope", async () => {
    const { calls, queries } = controlledFetch();

    await render(<ResourceTimelineExample input={flatTimeline} queries={queries} />);

    expect(calls).toHaveLength(1);
    expect(calls[0]!.window.range).toEqual({
      start: "2026-10-26T00:00:00Z",
      end: "2026-11-02T00:00:00Z",
    });
    expect(calls[0]!.window.timeZone).toBe("UTC");
    expect(calls[0]!.window.resourceScope).toEqual([
      "room-101",
      "room-102",
      "room-201",
      "room-202",
    ]);
    expect(windowStatus()).toBe("pending");
    await expect.element(page.getByText("Loading events for this window…")).toBeVisible();
    // The rows are there while the window loads.
    expect(document.querySelectorAll("[data-timeline-row]")).toHaveLength(4);
  });

  it("shows events that start before the window once it has loaded", async () => {
    const { calls, queries } = controlledFetch();
    await render(<ResourceTimelineExample input={flatTimeline} queries={queries} />);

    await calls[0]!.resolve([event("emma"), event("boiler")]);

    expect(windowStatus()).toBe("loaded");
    expect(shown("emma")?.dataset.startsBefore).toBe("true");
    expect(shown("boiler")).not.toBeNull();
    expect(document.body.textContent).not.toContain("Loading events");
  });

  it("tells a window with no events from one that has not been loaded", async () => {
    const { calls, queries } = controlledFetch();
    await render(<ResourceTimelineExample input={flatTimeline} queries={queries} />);

    await calls[0]!.resolve([]);

    expect(windowStatus()).toBe("loaded-empty");
    await expect.element(page.getByText("No stays or maintenance in this window.")).toBeVisible();
  });

  it("keeps loaded events while the next window is pending", async () => {
    const { calls, queries } = controlledFetch();
    await render(<ResourceTimelineExample input={flatTimeline} queries={queries} />);
    await calls[0]!.resolve([event("lena")]);

    await click("Next");

    expect(calls).toHaveLength(2);
    expect(calls[1]!.window.range.start).toBe("2026-11-02T00:00:00Z");
    expect(windowStatus()).toBe("pending");
    // Lena stays until 4 November, so she is in the next window too, while it loads.
    expect(shown("lena")).not.toBeNull();
    expect(document.querySelectorAll("[data-timeline-row]")).toHaveLength(4);
  });

  it("shows a failure beside the window, keeps what is loaded, and retries only when asked", async () => {
    const { calls, queries } = controlledFetch();
    await render(<ResourceTimelineExample input={flatTimeline} queries={queries} />);
    await calls[0]!.resolve([event("lena")]);
    await click("Next");

    await calls[1]!.reject(new Error("offline"));

    expect(windowStatus()).toBe("failed");
    await expect.element(page.getByText(/Could not load events for this window/)).toBeVisible();
    expect(shown("lena")).not.toBeNull();
    // Nothing asks again by itself.
    expect(calls).toHaveLength(2);

    await click("Retry");

    expect(calls).toHaveLength(3);
    expect(calls[2]!.window.key).toBe(calls[1]!.window.key);
    expect(windowStatus()).toBe("pending");
    await calls[2]!.resolve([]);
    expect(windowStatus()).toBe("loaded-empty");
    expect(shown("lena")).not.toBeNull();
  });

  it("does not ask again for a pending window however often the timeline renders", async () => {
    const { calls, queries } = controlledFetch();
    const { root } = await render(
      <ResourceTimelineExample input={flatTimeline} queries={queries} />,
    );

    for (let render = 0; render < 3; render += 1)
      await act(async () =>
        root.render(<ResourceTimelineExample input={{ ...flatTimeline }} queries={queries} />),
      );

    expect(calls).toHaveLength(1);
  });

  it("does not ask again for a window that failed, or that is already loaded", async () => {
    const { calls, queries } = controlledFetch();
    const { root } = await render(
      <ResourceTimelineExample input={flatTimeline} queries={queries} />,
    );
    await calls[0]!.reject(new Error("offline"));

    await act(async () =>
      root.render(<ResourceTimelineExample input={{ ...flatTimeline }} queries={queries} />),
    );
    expect(calls).toHaveLength(1);

    await click("Retry");
    await calls[1]!.resolve([event("emma")]);
    await act(async () =>
      root.render(<ResourceTimelineExample input={{ ...flatTimeline }} queries={queries} />),
    );

    expect(calls).toHaveLength(2);
  });

  it("does not retry a failed window just because the viewer comes back to it", async () => {
    const { calls, queries } = controlledFetch();
    await render(<ResourceTimelineExample input={flatTimeline} queries={queries} />);
    await calls[0]!.reject(new Error("offline"));
    await click("Retry");
    await calls[1]!.reject(new Error("still offline"));

    await click("Next");
    await calls[2]!.resolve([]);
    await click("Previous");

    // Only the click retried it: coming back shows the failure and waits for another click.
    expect(calls).toHaveLength(3);
    expect(windowStatus()).toBe("failed");
  });

  it("serves a window visited before from the application's cache", async () => {
    const { calls, queries } = controlledFetch();
    await render(<ResourceTimelineExample input={flatTimeline} queries={queries} />);
    await calls[0]!.resolve([event("emma")]);
    await click("Next");
    await calls[1]!.resolve([event("lena")]);

    await click("Previous");

    expect(calls).toHaveLength(2);
    expect(windowStatus()).toBe("loaded");
    expect(shown("emma")).not.toBeNull();
  });

  it("asks for the window again when the time zone changes it", async () => {
    const { calls, queries } = controlledFetch();
    await render(<ResourceTimelineExample input={flatTimeline} queries={queries} />);

    await click("Asia/Ho_Chi_Minh");

    expect(calls).toHaveLength(2);
    expect(calls[1]!.window.timeZone).toBe("Asia/Ho_Chi_Minh");
    expect(calls[1]!.window.key).not.toBe(calls[0]!.window.key);
  });

  describe("rapid navigation", () => {
    it("never lets a late response for another window replace the current one", async () => {
      const { calls, queries } = controlledFetch();
      await render(<ResourceTimelineExample input={flatTimeline} queries={queries} />);

      await click("Next");
      await click("Next");
      expect(calls.map((call) => call.window.range.start)).toEqual([
        "2026-10-26T00:00:00Z",
        "2026-11-02T00:00:00Z",
        "2026-11-09T00:00:00Z",
      ]);
      // The two windows that were left have no observer and are cancelled.
      expect(calls[0]!.signal.aborted).toBe(true);
      expect(calls[1]!.signal.aborted).toBe(true);

      // Their responses arrive after navigating away, the latest first.
      await calls[2]!.resolve([]);
      await calls[1]!.resolve([event("lena")]);
      await calls[0]!.resolve([event("emma")]);

      expect(windowStatus()).toBe("loaded-empty");
      expect(shown("emma")).toBeNull();
      expect(shown("lena")).toBeNull();
    });

    it("does not show a cancelled request as a failure", async () => {
      const { calls, queries } = controlledFetch();
      await render(<ResourceTimelineExample input={flatTimeline} queries={queries} />);

      await click("Next");
      await calls[0]!.reject(new DOMException("Aborted", "AbortError"));
      await click("Previous");

      expect(calls).toHaveLength(3);
      expect(windowStatus()).toBe("pending");
      expect(document.body.textContent).not.toContain("Could not load");
    });
  });

  describe("shared queries and cleanup", () => {
    it("releases its observation on unmount and cancels a request nobody else observes", async () => {
      const { calls, queries } = controlledFetch();
      const { root } = await render(
        <ResourceTimelineExample input={flatTimeline} queries={queries} />,
      );

      await act(async () => root.unmount());

      expect(calls[0]!.signal.aborted).toBe(true);
      expect(queries.getSnapshot().coverage).toEqual({});
    });

    it("does not cancel a query that another timeline shares", async () => {
      const { calls, queries } = controlledFetch();
      const first = await render(
        <ResourceTimelineExample input={flatTimeline} queries={queries} />,
      );
      await render(<ResourceTimelineExample input={flatTimeline} queries={queries} />);
      // Both ask for the same window and share one request.
      expect(calls).toHaveLength(1);

      await act(async () => first.root.unmount());

      expect(calls[0]!.signal.aborted).toBe(false);
      await calls[0]!.resolve([event("emma")]);
      expect(windowStatus()).toBe("loaded");
      expect(shown("emma")).not.toBeNull();
    });

    it("observes again after the development remount without leaving a request behind", async () => {
      const { calls, queries } = controlledFetch();

      await render(
        <StrictMode>
          <ResourceTimelineExample input={flatTimeline} queries={queries} />
        </StrictMode>,
      );

      // The first request was cancelled by the remount, the second is the one in flight.
      expect(calls.filter((call) => !call.signal.aborted)).toHaveLength(1);
      await calls.at(-1)!.resolve([event("emma")]);
      expect(windowStatus()).toBe("loaded");
    });
  });

  it("signals a window after React has committed, not while rendering", async () => {
    const seen: { retry: boolean; rendered: boolean; scope: readonly string[] }[] = [];
    function Harness({ events }: { events: readonly SampleEvent[] }) {
      const state = useResourceTimeline<unknown, { kind: StayKind }>({
        range: { start: "2026-10-26T00:00Z", end: "2026-11-02T00:00Z" },
        slotDuration: "P1D",
        resources: flatTimeline.resources,
        events,
        loading: {
          coverage: {},
          onLoadWindow: (window, { retry }) => {
            seen.push({
              retry,
              rendered: document.querySelector("[data-timeline-root]") !== null,
              scope: window.resourceScope,
            });
          },
        },
      });
      return state.status === "ready" ? (
        <ResourceTimeline.Root timeline={state.timeline}>
          <ResourceTimeline.WindowStatus loading={state.loading}>
            {({ state: windowState }) => windowState.status}
          </ResourceTimeline.WindowStatus>
        </ResourceTimeline.Root>
      ) : null;
    }

    const { root } = await render(<Harness events={[]} />);
    await act(async () => root.render(<Harness events={[event("emma")]} />));

    // The root was in the document when the signal was sent, and one render later, with
    // different events but the same window, there was no second signal.
    expect(seen).toEqual([
      {
        retry: false,
        rendered: true,
        scope: ["room-101", "room-102", "room-201", "room-202"],
      },
    ]);
    expect(document.querySelector("[data-timeline-window-status]")?.textContent).toBe("unknown");
  });

  it("reports an observer that throws instead of swallowing it", async () => {
    const errors: unknown[] = [];
    const failure = new Error("no query client");
    function Harness() {
      useResourceTimeline({
        range: { start: "2026-10-26T00:00Z", end: "2026-11-02T00:00Z" },
        slotDuration: "P1D",
        resources: flatTimeline.resources,
        events: [],
        loading: {
          onLoadWindow: () => {
            throw failure;
          },
        },
      });
      return null;
    }
    class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
      state = { failed: false };
      static getDerivedStateFromError(error: unknown) {
        errors.push(error);
        return { failed: true };
      }
      render() {
        return this.state.failed ? "failed" : this.props.children;
      }
    }

    await render(
      <Boundary>
        <Harness />
      </Boundary>,
    );

    expect(errors).toEqual([failure]);
  });
});
