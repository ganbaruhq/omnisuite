import type { CalendarEventInput, CalendarNodeInput } from "@omnisuite/calendar-core";
import type { SampleBoard, StayKind } from "@omnisuite/calendar-sample-data/sample-timeline";

// Fixtures for the dataset size the calendar is verified at: 100 resources and 1,000 events. They
// are generated, not stored, and deterministic, so a run can be repeated and a failure explained.

/** The week the fixtures fill, in UTC: events start and end inside it. */
export const datasetRange = { start: "2026-10-26T00:00:00Z", end: "2026-11-02T00:00:00Z" } as const;

export interface DatasetOptions {
  /** Resources that can hold events, grouped ten to a floor. */
  readonly resources: number;
  /** Unique events. */
  readonly events: number;
  /** The resources each event names, so that placements are `events * resourcesPerEvent`. */
  readonly resourcesPerEvent: number;
}

/** The baseline of the first release: 100 resources, 1,000 unique events, 1,000 placements. */
export const baselineDataset: DatasetOptions = {
  resources: 100,
  events: 1000,
  resourcesPerEvent: 1,
};

/** Events and placements are different numbers: 1,000 unique events with 2,000 placements. */
export const sharedDataset: DatasetOptions = { resources: 100, events: 1000, resourcesPerEvent: 2 };

const floorSize = 10;
const hour = 3_600_000;
const week = Date.parse(datasetRange.end) - Date.parse(datasetRange.start);

/** A small deterministic generator (mulberry32), so that no run depends on `Math.random`. */
function sequence(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `Room 1` to `Room N` ten to a floor, each floor a group that owns no events. */
export function datasetResources(count: number): CalendarNodeInput[] {
  const nodes: CalendarNodeInput[] = [];
  for (let index = 0; index < count; index += 1) {
    if (index % floorSize === 0)
      nodes.push({
        id: `floor-${index / floorSize + 1}`,
        title: `Floor ${index / floorSize + 1}`,
        kind: "group",
      });
    nodes.push({
      id: `room-${index + 1}`,
      title: `Room ${index + 1}`,
      parentId: `floor-${Math.floor(index / floorSize) + 1}`,
    });
  }
  return nodes;
}

/**
 * Events spread over the week of {@link datasetRange}: one to thirty-six hours long, starting on
 * the hour, so that rooms hold overlapping events in several lanes and short events beside long
 * ones. Every event names `resourcesPerEvent` different rooms.
 */
export function datasetEvents({
  resources,
  events,
  resourcesPerEvent,
}: DatasetOptions): CalendarEventInput<{ kind: StayKind }>[] {
  const random = sequence(20261026);
  const start = Date.parse(datasetRange.start);
  return Array.from({ length: events }, (_, index) => {
    const length = (1 + Math.floor(random() * 36)) * hour;
    const begin = start + Math.floor((random() * (week - length)) / hour) * hour;
    // Rooms are dealt out round the building, so each holds about the same number of events.
    const first = (index * 7) % resources;
    return {
      id: `event-${index + 1}`,
      resourceIds: Array.from(
        { length: resourcesPerEvent },
        (_, offset) => `room-${((first + offset * 13) % resources) + 1}`,
      ),
      title: `Event ${index + 1}`,
      start: new Date(begin).toISOString().replace(".000Z", "Z"),
      end: new Date(begin + length).toISOString().replace(".000Z", "Z"),
      data: { kind: index % 5 === 0 ? ("maintenance" as const) : ("stay" as const) },
    };
  });
}

export function datasetBoard(options: DatasetOptions): SampleBoard {
  return { resources: datasetResources(options.resources), events: datasetEvents(options) };
}
