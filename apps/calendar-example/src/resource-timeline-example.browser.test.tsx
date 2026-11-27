import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";
import { ResourceTimelineExample } from "./resource-timeline-example";
import { flatTimeline, sampleTimeline } from "./sample-timeline";
import "./styles.css";

let root: Root | undefined;
let container: HTMLElement | undefined;

async function render(node: ReactNode) {
  container = document.body.appendChild(document.createElement("div"));
  root = createRoot(container);
  await act(async () => root!.render(node));
}

afterEach(async () => {
  await act(async () => root?.unmount());
  container?.remove();
});

const lane = (resource: string) =>
  page
    .getByRole("list", { name: `${resource} events` })
    .element()
    .getBoundingClientRect();
const eventBox = (id: string) =>
  document.querySelector(`[data-event-id="${id}"]`)!.getBoundingClientRect();
/** The x coordinate `days` into the week shown on a lane. */
const at = (bounds: DOMRect, days: number) => bounds.left + (bounds.width * days) / 7;

describe("ResourceTimelineExample", () => {
  it("shows one row for each loaded resource", async () => {
    await render(<ResourceTimelineExample input={flatTimeline} />);

    for (const room of ["Room 101", "Room 102", "Room 201", "Room 202"])
      await expect.element(page.getByRole("group", { name: room })).toBeVisible();
    expect(document.querySelectorAll("[data-timeline-row]")).toHaveLength(4);
  });

  it("lines the axis slots up with the lanes", async () => {
    await render(<ResourceTimelineExample input={flatTimeline} />);

    const bounds = lane("Room 101");
    // Seven one-day slots of at least 7rem each.
    expect(bounds.width).toBeGreaterThanOrEqual(7 * 7 * 16 - 1);
    const slots = [...document.querySelectorAll("[data-timeline-slot]")].map((slot) =>
      slot.getBoundingClientRect(),
    );
    expect(slots).toHaveLength(7);
    slots.forEach((slot, day) => {
      expect(slot.left).toBeCloseTo(at(bounds, day), 0);
      expect(slot.width).toBeCloseTo(bounds.width / 7, 0);
    });
  });

  it("places adjacent stays edge to edge without overlapping", async () => {
    await render(<ResourceTimelineExample input={flatTimeline} />);

    const bounds = lane("Room 101");
    const emma = eventBox("emma");
    const noah = eventBox("noah");
    // Emma checks out at noon on day 1 of the week; Noah checks in at the same instant.
    expect(emma.right).toBeCloseTo(at(bounds, 1.5), 0);
    expect(noah.left).toBeCloseTo(emma.right, 0);
    expect(noah.right).toBeCloseTo(at(bounds, 4.5), 0);
    await expect
      .element(page.getByRole("listitem", { name: /^Noah Tran, 27 Oct, 12:00 – 30 Oct, 12:00$/ }))
      .toBeVisible();
  });

  it("clips events at the edges of the week and marks the clipped ends", async () => {
    await render(<ResourceTimelineExample input={flatTimeline} />);

    const room101 = lane("Room 101");
    const emma = document.querySelector<HTMLElement>('[data-event-id="emma"]')!;
    expect(emma.getBoundingClientRect().left).toBeCloseTo(room101.left, 0);
    expect(emma.dataset.startsBefore).toBe("true");
    expect(emma.dataset.endsAfter).toBeUndefined();

    const room201 = lane("Room 201");
    const lena = document.querySelector<HTMLElement>('[data-event-id="lena"]')!;
    expect(lena.getBoundingClientRect().left).toBeCloseTo(at(room201, 3 + 14 / 24), 0);
    expect(lena.getBoundingClientRect().right).toBeCloseTo(room201.right, 0);
    expect(lena.dataset.endsAfter).toBe("true");
  });

  it("shows a shared event under each assigned resource at the same place", async () => {
    await render(<ResourceTimelineExample />);

    const drills = [...document.querySelectorAll<HTMLElement>('[data-event-id="fire-drill"]')];
    expect(
      drills.map((drill) => drill.closest("[data-timeline-row]")?.getAttribute("aria-label")),
    ).toEqual(["Room 201", "Room 202"]);
    expect(new Set(drills.map((drill) => drill.dataset.occurrenceId)).size).toBe(2);
    const [first, second] = drills.map((drill) => drill.getBoundingClientRect());
    expect(first!.left).toBeCloseTo(second!.left, 0);
    expect(first!.width).toBeCloseTo(second!.width, 0);
    expect(first!.left).toBeCloseTo(at(lane("Room 201"), 1 + 9 / 24), 0);
  });

  it("refreshes every occurrence of a shared event when the events change", async () => {
    await render(<ResourceTimelineExample />);
    const moved = {
      ...sampleTimeline,
      events: sampleTimeline.events.map((event) =>
        event.id === "fire-drill"
          ? { ...event, start: "2026-10-30T09:00Z", end: "2026-10-30T21:00Z" }
          : event,
      ),
    };

    await act(async () => root!.render(<ResourceTimelineExample input={moved} />));

    const drills = [...document.querySelectorAll('[data-event-id="fire-drill"]')];
    expect(drills).toHaveLength(2);
    for (const [index, resource] of ["Room 201", "Room 202"].entries()) {
      const box = drills[index]!.getBoundingClientRect();
      expect(box.left).toBeCloseTo(at(lane(resource), 4 + 9 / 24), 0);
      expect(box.width).toBeCloseTo((lane(resource).width * 12) / 24 / 7, 0);
    }
  });

  it("stacks overlapping events in lanes and grows the row to fit them", async () => {
    await render(<ResourceTimelineExample />);

    const boiler = eventBox("boiler");
    const clean = eventBox("deep-clean");
    // Both fall on the morning of 28 Oct, so they share time but not height.
    expect(clean.left).toBeGreaterThan(boiler.left);
    expect(clean.left).toBeLessThan(boiler.right);
    expect(clean.top).toBeGreaterThanOrEqual(boiler.bottom - 0.5);
    expect(lane("Room 102").height).toBeCloseTo(2 * lane("Room 101").height, 0);
    expect(boiler.top).toBeGreaterThanOrEqual(lane("Room 102").top);
    expect(clean.bottom).toBeLessThanOrEqual(lane("Room 102").bottom + 0.5);
  });

  it("shows where the input is invalid instead of a timeline", async () => {
    const [first, ...rest] = sampleTimeline.events;
    await render(
      <ResourceTimelineExample
        input={{ ...sampleTimeline, events: [{ ...first!, end: first!.start }, ...rest] }}
      />,
    );

    await expect.element(page.getByRole("alert")).toMatchTextContent(/events\.0\.end/);
    expect(document.querySelector("[data-timeline-root]")).toBeNull();
  });
});

const slotLabels = () =>
  [...document.querySelectorAll("[data-timeline-slot]")].map((slot) => slot.textContent);
const stay = (id: string, start: string, end: string) => ({
  id,
  resourceIds: ["room-101"],
  title: id,
  start,
  end,
  data: { kind: "stay" as const },
});

describe("ResourceTimelineExample scales", () => {
  it("shows a day of hours, four weeks or twelve months as the viewer picks a scale", async () => {
    await render(<ResourceTimelineExample />);
    expect(slotLabels()).toHaveLength(7);

    await page.getByRole("button", { name: "Hour" }).click();
    expect(slotLabels()).toHaveLength(24);
    expect(slotLabels()[0]).toBe("Mon 26 Oct12:00");
    await page.getByRole("button", { name: "Week" }).click();
    expect(slotLabels()).toEqual([
      "Week of26 Oct",
      "Week of2 Nov",
      "Week of9 Nov",
      "Week of16 Nov",
    ]);
    await page.getByRole("button", { name: "Month" }).click();
    expect(slotLabels()).toHaveLength(12);
    expect(slotLabels()[0]).toBe("2026Oct");
    await expect
      .element(page.getByRole("button", { name: "Month" }))
      .toHaveAttribute("aria-pressed", "true");
  });

  it("keeps events at the same instants when the display time zone changes", async () => {
    await render(<ResourceTimelineExample />);
    const noah = page.getByRole("listitem", { name: /^Noah Tran/ });
    await expect.element(noah).toHaveAccessibleName("Noah Tran, 27 Oct, 12:00 – 30 Oct, 12:00");

    await page.getByRole("button", { name: "Asia/Ho_Chi_Minh" }).click();
    // The same stay, read on a clock seven hours ahead.
    await expect.element(noah).toHaveAccessibleName("Noah Tran, 27 Oct, 19:00 – 30 Oct, 19:00");
    // The week now starts at 17:00 UTC on 25 October, so each stay moves 7/24 of a day earlier.
    const bounds = lane("Room 101");
    expect(eventBox("noah").left).toBeCloseTo(at(bounds, 1 + 12 / 24 + 7 / 24), 0);
    expect(eventBox("noah").right).toBeCloseTo(at(bounds, 4 + 12 / 24 + 7 / 24), 0);

    await page.getByRole("button", { name: "America/New_York" }).click();
    await expect.element(noah).toHaveAccessibleName("Noah Tran, 27 Oct, 08:00 – 30 Oct, 08:00");
  });

  it("generates the days of a week in the display time zone", async () => {
    await render(<ResourceTimelineExample initialTimeZone="Asia/Ho_Chi_Minh" />);

    expect(slotLabels()).toEqual(["Mon26", "Tue27", "Wed28", "Thu29", "Fri30", "Sat31", "Sun1"]);
    // 12:00Z on 26 October is 19:00 in Ho Chi Minh City, the same day.
    await expect.element(page.getByText("2026", { exact: false }).first()).toBeVisible();
    await expect
      .element(page.getByText("26 Oct 2026 – 2 Nov 2026 (Asia/Ho_Chi_Minh)"))
      .toBeVisible();
  });
});

describe("ResourceTimelineExample daylight saving time", () => {
  const newYork = { initialTimeZone: "America/New_York" } as const;

  it("shows the repeated hour twice, each with its offset", async () => {
    await render(
      <ResourceTimelineExample {...newYork} initialPreset="hour" anchor="2026-11-01T04:00Z" />,
    );

    const labels = slotLabels();
    expect(labels).toHaveLength(25);
    expect(labels.slice(0, 5)).toEqual([
      "Sun 1 Nov00:00",
      "01:00 GMT-4",
      "01:00 GMT-5",
      "02:00",
      "03:00",
    ]);
    const repeated = document.querySelectorAll("[data-timeline-slot][data-repeated]");
    expect(repeated).toHaveLength(2);
  });

  it("projects against a 25-hour day rather than a 24-hour one", async () => {
    await render(
      <ResourceTimelineExample
        {...newYork}
        input={{
          ...flatTimeline,
          events: [stay("extra-hour", "2026-11-01T06:00Z", "2026-11-01T07:00Z")],
        }}
      />,
    );

    const bounds = lane("Room 101");
    // The week's last day, Sunday 1 November, began at 04:00Z and lasts 25 hours.
    expect(slotLabels()?.at(-1)).toBe("Sun1");
    expect(eventBox("extra-hour").left).toBeCloseTo(at(bounds, 6 + 2 / 25), 0);
    // One hour of a 25-hour day-slot, of seven slots. Padding keeps the box wider than that.
    const share = parseFloat(
      document.querySelector<HTMLElement>('[data-event-id="extra-hour"]')!.style.width,
    );
    expect(share).toBeCloseTo(100 / 7 / 25, 5);
  });
});

describe("resource hierarchy disclosures", () => {
  it("renders nested headings and resource rows with distinct identities and depths", async () => {
    await render(<ResourceTimelineExample />);
    await expect.element(page.getByRole("heading", { name: "Riverside", level: 1 })).toBeVisible();
    await expect
      .element(page.getByRole("heading", { name: "First floor", level: 2 }))
      .toBeVisible();
    const group = document.querySelector('[data-group-id="floor-1"]')!;
    expect(group.getAttribute("data-kind")).toBe("group");
    expect(group.hasAttribute("data-resource-id")).toBe(false);
    expect(group.querySelector("[data-timeline-lane]")).toBeNull();
    const room = document.querySelector('[data-resource-id="room-101"]')!;
    expect(room.getAttribute("data-kind")).toBe("resource");
    expect(room.getAttribute("data-depth")).toBe("2");
    expect(
      document.querySelector('[data-resource-id="bed-101-a"]')!.getAttribute("data-depth"),
    ).toBe("3");
    await expect.element(page.getByRole("listitem", { name: /^Bed inspection,/ })).toBeVisible();
    expect(page.getByRole("button", { name: /Bed 101/ }).elements()).toHaveLength(0);
  });

  it("uses Enter and Space to collapse and reopen while retaining nested state and parent events", async () => {
    await render(<ResourceTimelineExample />);
    const room = page.getByRole("button", { name: "Collapse Room 101" });
    expect(room.element().getAttribute("aria-expanded")).toBe("true");
    expect(room.element().getAttribute("aria-description")).toBe("Resource, level 3");
    room.element().focus();
    await userEvent.keyboard("{Enter}");
    const collapsedRoom = page.getByRole("button", { name: "Expand Room 101" });
    await expect.element(collapsedRoom).toHaveFocus();
    await expect.element(collapsedRoom).toHaveAttribute("aria-expanded", "false");
    expect(document.querySelector('[data-resource-id="bed-101-a"]')).toBeNull();
    expect(document.querySelector('[data-event-id="bed-check"]')).toBeNull();
    await expect.element(page.getByRole("listitem", { name: /^Noah Tran,/ })).toBeVisible();

    const floor = page.getByRole("button", { name: "Collapse First floor" });
    floor.element().focus();
    await userEvent.keyboard(" ");
    await expect
      .element(page.getByRole("button", { name: "Expand First floor" }))
      .toHaveAttribute("aria-expanded", "false");
    expect(document.querySelector('[data-resource-id="room-101"]')).toBeNull();
    await expect.element(page.getByRole("group", { name: "Room 201", exact: true })).toBeVisible();
    await userEvent.keyboard(" ");
    await expect
      .element(page.getByRole("button", { name: "Expand Room 101" }))
      .toHaveAttribute("aria-expanded", "false");
    expect(document.querySelector('[data-resource-id="bed-101-a"]')).toBeNull();
    await page.getByRole("button", { name: "Expand Room 101" }).click();
    await expect.element(page.getByRole("listitem", { name: /^Bed inspection,/ })).toBeVisible();
    await page.getByRole("button", { name: "Collapse Riverside" }).click();
    expect(document.querySelectorAll("[data-resource-id]")).toHaveLength(0);
    await page.getByRole("button", { name: "Expand Riverside" }).click();
    await expect.element(page.getByRole("listitem", { name: /^Bed inspection,/ })).toBeVisible();
  });

  it("preserves expansion across input updates and temporary resource removal", async () => {
    await render(<ResourceTimelineExample />);
    await page.getByRole("button", { name: "Collapse Room 101" }).click();
    await act(async () =>
      root!.render(
        <ResourceTimelineExample
          input={{ ...sampleTimeline, resources: [{ id: "temporary", title: "Temporary" }] }}
        />,
      ),
    );
    expect(document.querySelector('[data-resource-id="room-101"]')).toBeNull();
    await act(async () =>
      root!.render(
        <ResourceTimelineExample
          input={{ ...sampleTimeline, events: [...sampleTimeline.events] }}
        />,
      ),
    );
    await expect
      .element(page.getByRole("button", { name: "Expand Room 101" }))
      .toHaveAttribute("aria-expanded", "false");
    expect(document.querySelector('[data-resource-id="bed-101-a"]')).toBeNull();
  });
});
