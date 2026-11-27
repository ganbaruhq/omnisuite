import type { CalendarEventInput, EventProposal } from "@omnisuite/calendar-core";
import { ResourceTimeline, useResourceTimeline } from "@omnisuite/calendar-react";
import { Button } from "@omnisuite/ui/components/button";
import { act, createRef, useState, type ComponentProps, type Ref } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";
import "./styles.css";

// A consumer replaces the element a part renders with its own component. These tests use the
// public `render` prop the way an application's locally owned shadcn components would, and check
// what the part promises: the refs, handlers, placement, accessible names and structure survive.

type Event = CalendarEventInput<{ kind?: string }>;
type Proposal = EventProposal<{ kind?: string }>;

const resources = [
  { id: "floor", title: "Floor", kind: "group" as const },
  { id: "r1", title: "Room 1", parentId: "floor" },
  { id: "r2", title: "Room 2", parentId: "floor" },
];
const events: Event[] = [
  {
    id: "standup",
    resourceIds: ["r1"],
    title: "Standup",
    start: "2026-10-26T09:00:00Z",
    end: "2026-10-26T10:00:00Z",
  },
];

/** A locally owned card: it takes the props and the ref it is given, like a shadcn component. */
function EventCard({ className, ref, ...props }: ComponentProps<"article">) {
  return (
    <article data-slot="event-card" ref={ref} className={`card ${className ?? ""}`} {...props} />
  );
}

let root: Root | undefined;
let container: HTMLElement | undefined;
let proposals: Proposal[];

interface Hosts {
  event?: ComponentProps<typeof ResourceTimeline.Event>["render"];
  row?: ComponentProps<typeof ResourceTimeline.ResourceRow>["render"];
  group?: ComponentProps<typeof ResourceTimeline.GroupRow>["render"];
  lane?: ComponentProps<typeof ResourceTimeline.Lane>["render"];
  preview?: ComponentProps<typeof ResourceTimeline.Preview>["render"];
  disclosure?: ComponentProps<typeof ResourceTimeline.Disclosure>["render"];
  eventRef?: Ref<HTMLDivElement>;
  onEventKeyDown?: ComponentProps<typeof ResourceTimeline.Event>["onKeyDown"];
}

function Fixture({ hosts }: { hosts: Hosts }) {
  const [current, setEvents] = useState(events);
  const state = useResourceTimeline<unknown, { kind?: string }>({
    range: { start: "2026-10-26T00:00:00Z", end: "2026-10-27T00:00:00Z" },
    slotDuration: "PT1H",
    resources,
    events: current,
    editing: { snap: "PT1H", startEditable: true, resourceEditable: true, durationEditable: true },
    onProposal: (proposal) => {
      proposals.push(proposal);
      setEvents((all) =>
        all.map((event) => (event.id === proposal.eventId ? proposal.after : event)),
      );
    },
  });
  if (state.status === "invalid") return <p role="alert">{state.error.message}</p>;
  const { timeline, visibleRows, collapsedIds, toggleExpanded, editor } = state;
  return (
    <ResourceTimeline.Root timeline={timeline} editor={editor}>
      <ResourceTimeline.Status />
      <ResourceTimeline.Viewport aria-label="Timeline" style={{ width: 900, height: 300 }}>
        {visibleRows.map((row) => {
          const disclosure = (
            <ResourceTimeline.Disclosure
              row={row}
              expanded={!collapsedIds.has(row.resource.id)}
              onExpandedChange={() => toggleExpanded(row.resource.id)}
              render={hosts.disclosure}
            >
              toggle
            </ResourceTimeline.Disclosure>
          );
          return row.kind === "group" ? (
            <ResourceTimeline.GroupRow key={row.resource.id} row={row} render={hosts.group}>
              {disclosure}
              {row.resource.title}
            </ResourceTimeline.GroupRow>
          ) : (
            <ResourceTimeline.ResourceRow
              key={row.resource.id}
              row={row}
              render={hosts.row}
              style={{ display: "flex", height: 60 }}
            >
              <span style={{ width: 100, flexShrink: 0 }}>{row.resource.title}</span>
              <ResourceTimeline.Lane style={{ width: 24 * 50, flexShrink: 0 }} render={hosts.lane}>
                {row.placements.map((placement) => (
                  <ResourceTimeline.Event
                    key={placement.occurrenceId}
                    placement={placement}
                    aria-label={placement.event.title}
                    render={hosts.event}
                    ref={hosts.eventRef}
                    onKeyDown={hosts.onEventKeyDown}
                  >
                    <ResourceTimeline.ResizeHandle edge="start" style={{ width: 8 }} />
                    {placement.event.title}
                    <ResourceTimeline.ResizeHandle edge="end" style={{ width: 8 }} />
                  </ResourceTimeline.Event>
                ))}
                <ResourceTimeline.Preview render={hosts.preview} />
              </ResourceTimeline.Lane>
            </ResourceTimeline.ResourceRow>
          );
        })}
      </ResourceTimeline.Viewport>
    </ResourceTimeline.Root>
  );
}

async function render(hosts: Hosts) {
  container = document.body.appendChild(document.createElement("div"));
  root = createRoot(container);
  await act(async () => root!.render(<Fixture hosts={hosts} />));
}

beforeEach(async () => {
  proposals = [];
  await page.viewport(1280, 900);
});

afterEach(async () => {
  await page.viewport(414, 896);
  await act(async () => root?.unmount());
  container?.remove();
  root = undefined;
});

const standup = () => document.querySelector<HTMLElement>('[data-event-id="standup"]')!;

describe("replacing the host of an event", () => {
  it("renders the consumer's element in place of the default one", async () => {
    await render({ event: <EventCard /> });

    const host = standup();
    expect(host.tagName).toBe("ARTICLE");
    expect(host.dataset.slot).toBe("event-card");
    // The part's own role, name and placement still apply to the replaced element.
    expect(host.getAttribute("role")).toBe("listitem");
    expect(host.getAttribute("aria-label")).toBe("Standup");
    expect(host.dataset.occurrenceId).toContain("standup");
    expect(host.dataset.movable).toBe("true");
    expect(host.style.position).toBe("absolute");
    const lane = host.closest("[data-timeline-lane]")!.getBoundingClientRect();
    expect(host.getBoundingClientRect().left).toBeCloseTo(lane.left + 9 * 50, 0);
    expect(host.getBoundingClientRect().width).toBeCloseTo(50, 0);
  });

  it("takes a function that spreads the part's props onto its own element", async () => {
    await render({ event: (props) => <EventCard {...props} data-from="function" /> });

    expect(standup().dataset.from).toBe("function");
    expect(standup().getAttribute("aria-label")).toBe("Standup");
    expect(standup().dataset.eventId).toBe("standup");
  });

  it("keeps the element's own props and merges them with the part's", async () => {
    const onClick = vi.fn();
    await render({
      event: (
        <EventCard
          className="from-element"
          data-kept="yes"
          style={{ color: "rgb(1, 2, 3)" }}
          onClick={onClick}
        />
      ),
    });

    const host = standup();
    expect(host.className).toContain("from-element");
    expect(host.dataset.kept).toBe("yes");
    expect(host.style.color).toBe("rgb(1, 2, 3)");
    // The part's placement is not lost to the element's own style.
    expect(host.style.position).toBe("absolute");
    await userEvent.click(host);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("hands the node to the element's ref, the consumer's ref and the part's own", async () => {
    const own = createRef<HTMLElement>();
    const given = createRef<HTMLDivElement>();
    await render({ event: <EventCard ref={own} />, eventRef: given });

    expect(own.current).toBe(standup());
    expect(given.current).toBe(standup());

    // The part's own ref still reaches dnd-kit: the replaced element can be moved by the keyboard.
    standup().focus();
    await userEvent.keyboard("{Enter}{ArrowRight}{Enter}");
    expect(proposals).toHaveLength(1);
    expect(proposals[0]!.after.start).toBe("2026-10-26T10:00:00Z");
  });

  it("runs the element's handler and then the part's, and lets either keep a key", async () => {
    const seen: string[] = [];
    await render({
      event: <EventCard onKeyDown={(event) => seen.push(`element:${event.key}`)} />,
      onEventKeyDown: (event) => seen.push(`consumer:${event.key}`),
    });

    standup().focus();
    await userEvent.keyboard("{Enter}{ArrowRight}{Enter}");
    expect(seen).toContain("element:Enter");
    expect(seen).toContain("consumer:Enter");
    expect(proposals).toHaveLength(1);

    // An element handler that prevents the default keeps the key from starting an edit.
    await act(async () => root?.unmount());
    container?.remove();
    proposals = [];
    await render({ event: <EventCard onKeyDown={(event) => event.preventDefault()} /> });
    standup().focus();
    await userEvent.keyboard("{Enter}{ArrowRight}{Enter}");
    expect(proposals).toEqual([]);
  });

  it("keeps the accessible name, resize handles and keyboard resize on the replaced element", async () => {
    await render({ event: <EventCard /> });

    await expect.element(page.getByRole("listitem", { name: "Standup" })).toBeVisible();
    expect(standup().querySelectorAll("[data-timeline-resize-handle]")).toHaveLength(2);
    // No control is nested inside the event: the handles are hidden from assistive technology.
    expect(
      standup().querySelectorAll("button, a, input, select, textarea, [tabindex]"),
    ).toHaveLength(0);
    for (const handle of standup().querySelectorAll("[data-timeline-resize-handle]"))
      expect(handle.getAttribute("aria-hidden")).toBe("true");

    standup().focus();
    await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}{Enter}");
    expect(proposals).toHaveLength(1);
    expect(proposals[0]!.operation).toBe("resize");
    expect(proposals[0]!.after.end).toBe("2026-10-26T11:00:00Z");
  });

  it("is hidden and stood in for by the preview while it is moved, whatever its host", async () => {
    await render({ event: <EventCard />, preview: <EventCard data-slot="preview-card" /> });

    standup().focus();
    await userEvent.keyboard("{Enter}{ArrowRight}");
    expect(standup().dataset.dragging).toBe("true");
    const previewHost = document.querySelector<HTMLElement>("[data-timeline-preview]")!;
    expect(previewHost.tagName).toBe("ARTICLE");
    expect(previewHost.dataset.slot).toBe("preview-card");
    expect(previewHost.getAttribute("aria-label")).toBeTruthy();
    await userEvent.keyboard("{Escape}");
    expect(proposals).toEqual([]);
  });
});

describe("replacing the host of rows, lanes and disclosures", () => {
  it("renders rows as the consumer's element and still finds them as move targets", async () => {
    await render({
      row: (props) => <section {...props} data-from="row" />,
      group: (props) => <header {...props} data-from="group" />,
      lane: <div data-from="lane" />,
    });

    const row = document.querySelector<HTMLElement>('[data-resource-id="r1"]')!;
    expect(row.tagName).toBe("SECTION");
    expect(row.dataset.from).toBe("row");
    expect(row.getAttribute("aria-label")).toBe("Room 1");
    expect(document.querySelector('[data-group-id="floor"]')!.tagName).toBe("HEADER");
    const lane = row.querySelector<HTMLElement>("[data-timeline-lane]")!;
    expect(lane.dataset.from).toBe("lane");
    expect(lane.getAttribute("role")).toBe("list");
    expect(lane.style.position).toBe("relative");

    // Rows and lanes are still registered: a keyboard move to the next row lands in it.
    standup().focus();
    await userEvent.keyboard("{Enter}{ArrowDown}{Enter}");
    expect(proposals).toHaveLength(1);
    expect(proposals[0]!.after.resourceIds).toEqual(["r2"]);
  });

  it("renders the disclosure as a shared Button and keeps its name and state", async () => {
    await render({ disclosure: <Button variant="ghost" size="sm" /> });

    const toggle = page.getByRole("button", { name: "Collapse Floor" });
    await expect.element(toggle).toBeVisible();
    const button = toggle.element() as HTMLElement;
    expect(button.dataset.slot).toBe("button");
    expect(button.getAttribute("aria-expanded")).toBe("true");
    await userEvent.click(button);
    await expect.element(page.getByRole("button", { name: "Expand Floor" })).toBeVisible();
    expect(document.querySelector('[data-resource-id="r1"]')).toBeNull();
    // Keyboard operation is the native button's.
    (document.querySelector("[data-timeline-disclosure]") as HTMLElement).focus();
    await userEvent.keyboard("{Enter}");
    expect(document.querySelector('[data-resource-id="r1"]')).not.toBeNull();
  });
});

describe("what a host cannot do", () => {
  it("a function host that ignores the props still renders, without the part's behavior", async () => {
    // Documented contract: spread the props. This pins that the part passes them all in one object.
    const received: Record<string, unknown>[] = [];
    await render({
      event: (props) => {
        received.push(props as Record<string, unknown>);
        return <EventCard {...props} />;
      },
    });
    const props = received.at(-1)!;
    expect(props["data-event-id"]).toBe("standup");
    expect(typeof props.onKeyDown).toBe("function");
    expect(props.style).toMatchObject({ position: "absolute" });
    expect(props.ref).toBeTypeOf("function");
  });
});
