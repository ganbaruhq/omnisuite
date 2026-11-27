import type { CalendarEventInput, CalendarNodeInput, EditingInput } from "@omnisuite/calendar-core";

export type StayKind = "stay" | "maintenance";

/** What the example shows; the range and slot size come from the scale the viewer picks. */
export interface SampleBoard {
  readonly resources: readonly CalendarNodeInput[];
  readonly events: readonly CalendarEventInput<{ kind: StayKind }>[];
}

/**
 * A small hostel board around the week of 26 October 2026, with flat rooms. Clocks go back in
 * New York on 1 November, so showing it in that time zone makes one day last 25 hours.
 */
export const flatTimeline: SampleBoard = {
  resources: [
    { id: "room-101", title: "Room 101" },
    { id: "room-102", title: "Room 102" },
    { id: "room-201", title: "Room 201" },
    { id: "room-202", title: "Room 202" },
  ],
  events: [
    {
      id: "emma",
      resourceIds: ["room-101"],
      title: "Emma Laurent",
      start: "2026-10-24T14:00Z",
      end: "2026-10-27T12:00Z",
      data: { kind: "stay" },
    },
    {
      id: "noah",
      resourceIds: ["room-101"],
      title: "Noah Tran",
      start: "2026-10-27T12:00Z",
      end: "2026-10-30T12:00Z",
      data: { kind: "stay" },
    },
    {
      id: "earlier",
      resourceIds: ["room-102"],
      title: "Earlier stay",
      start: "2026-10-22T14:00Z",
      end: "2026-10-26T00:00Z",
      data: { kind: "stay" },
    },
    {
      id: "boiler",
      resourceIds: ["room-102"],
      title: "Boiler service",
      start: "2026-10-28T08:00Z",
      end: "2026-10-28T17:00Z",
      data: { kind: "maintenance" },
    },
    {
      // A second event on the same morning as the boiler service: the two share Room 102's row
      // in separate lanes.
      id: "deep-clean",
      resourceIds: ["room-102"],
      title: "Deep clean",
      start: "2026-10-28T10:00Z",
      end: "2026-10-28T12:00Z",
      data: { kind: "maintenance" },
    },
    {
      // One event under every room it names; Room 301 is not loaded, so it has no row.
      id: "fire-drill",
      resourceIds: ["room-201", "room-202", "room-301"],
      title: "Fire drill",
      start: "2026-10-27T09:00Z",
      end: "2026-10-27T10:00Z",
      data: { kind: "maintenance" },
    },
    {
      id: "lena",
      resourceIds: ["room-201"],
      title: "Lena Park",
      start: "2026-10-29T14:00Z",
      end: "2026-11-04T12:00Z",
      data: { kind: "stay" },
    },
    {
      // Room 301 is not loaded, so this stay is kept but has no row to show in.
      id: "ken",
      resourceIds: ["room-301"],
      title: "Ken Sato",
      start: "2026-10-27T14:00Z",
      end: "2026-10-29T12:00Z",
      data: { kind: "stay" },
    },
  ],
};

/** The same stays under nested groups, rooms and beds. */
export const sampleTimeline: SampleBoard = {
  ...flatTimeline,
  resources: [
    { id: "hostel", title: "Riverside", kind: "group" },
    { id: "floor-1", title: "First floor", kind: "group", parentId: "hostel" },
    { id: "room-101", title: "Room 101", parentId: "floor-1" },
    { id: "bed-101-a", title: "Bed 101 A", parentId: "room-101" },
    { id: "bed-101-b", title: "Bed 101 B", parentId: "room-101" },
    { id: "room-102", title: "Room 102", parentId: "floor-1" },
    { id: "floor-2", title: "Second floor", kind: "group", parentId: "hostel" },
    { id: "room-201", title: "Room 201", parentId: "floor-2" },
    { id: "room-202", title: "Room 202", parentId: "floor-2" },
  ],
  events: [
    ...flatTimeline.events,
    {
      id: "bed-check",
      resourceIds: ["bed-101-a"],
      title: "Bed inspection",
      start: "2026-10-28T08:00Z",
      end: "2026-10-28T17:00Z",
      data: { kind: "maintenance" },
    },
  ],
};

/**
 * How the example lets events change: by the hour, in time and between rooms, with either edge
 * resizable too. The one rule is the hostel's own: two stays cannot share a room at once, while
 * maintenance may happen around a stay.
 */
export const sampleEditing: EditingInput<{ kind: StayKind }> = {
  snap: "PT1H",
  startEditable: true,
  resourceEditable: true,
  durationEditable: true,
  overlap: (stationary, moving) => stationary.data?.kind !== "stay" || moving.data?.kind !== "stay",
};

/**
 * The same hostel as a server would hold it, to be loaded a page or a branch at a time: the top
 * level is two buildings (each with children to load) and ten cottages, the first floor holds rooms
 * that have beds to load, and the annex holds more rooms than one page. Every `parentId` is the
 * node's one real parent, so a late response can only ever land under it.
 */
export const lazyServerResources: readonly CalendarNodeInput[] = [
  { id: "hostel", title: "Riverside", kind: "group", lazyChildren: true },
  { id: "annex", title: "Annex", kind: "group", lazyChildren: true },
  ...Array.from({ length: 10 }, (_, index) => ({
    id: `cottage-${index + 1}`,
    title: `Cottage ${index + 1}`,
  })),
  { id: "floor-1", title: "First floor", kind: "group", parentId: "hostel", lazyChildren: true },
  { id: "floor-2", title: "Second floor", kind: "group", parentId: "hostel", lazyChildren: true },
  { id: "room-101", title: "Room 101", parentId: "floor-1", lazyChildren: true },
  { id: "room-102", title: "Room 102", parentId: "floor-1" },
  { id: "bed-101-a", title: "Bed 101 A", parentId: "room-101" },
  { id: "bed-101-b", title: "Bed 101 B", parentId: "room-101" },
  { id: "room-201", title: "Room 201", parentId: "floor-2" },
  { id: "room-202", title: "Room 202", parentId: "floor-2" },
  ...Array.from({ length: 12 }, (_, index) => ({
    id: `annex-${index + 1}`,
    title: `Annex room ${index + 1}`,
    parentId: "annex",
  })),
];

/** Stays on resources that load late, so an event can be known before its row is. */
export const lazyServerEvents: readonly SampleBoard["events"][number][] = [
  ...sampleTimeline.events,
  {
    id: "cottage-stay",
    resourceIds: ["cottage-3", "cottage-4"],
    title: "Family reunion",
    start: "2026-10-27T14:00Z",
    end: "2026-10-30T10:00Z",
    data: { kind: "stay" },
  },
  {
    id: "annex-stay",
    resourceIds: ["annex-7"],
    title: "Tour group",
    start: "2026-10-28T14:00Z",
    end: "2026-10-31T10:00Z",
    data: { kind: "stay" },
  },
];
