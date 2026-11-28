import type { EventPlacement, Timeline, TimelineRow, TimelineSlot } from "./timeline.js";

/** Where a slot sits along the time axis, in percent of the whole range. */
export interface SlotBox {
  readonly inlineStart: number;
  readonly inlineSize: number;
}

/**
 * Where an occurrence sits within its row, in percent: along the time axis, and between the
 * row's top and bottom edges for its lane.
 */
export interface PlacementBox extends SlotBox {
  readonly blockStart: number;
  readonly blockEnd: number;
}

/** A length along the time axis as a share of the whole range, in percent. */
const percentOf = (timeline: Pick<Timeline, "span">, slots: number) =>
  (slots / timeline.span) * 100;

/** The box of a slot of the time axis. Each renderer turns the numbers into its own units. */
export function slotBoxOf(timeline: Pick<Timeline, "span">, slot: TimelineSlot): SlotBox {
  return {
    inlineStart: percentOf(timeline, slot.offset),
    inlineSize: percentOf(timeline, slot.span),
  };
}

/** The box of an occurrence or a preview within a row of `laneCount` lanes. */
export function placementBoxOf(
  timeline: Pick<Timeline, "span">,
  laneCount: number,
  placement: Pick<EventPlacement<any>, "offset" | "span" | "lane">,
): PlacementBox {
  return {
    inlineStart: percentOf(timeline, placement.offset),
    inlineSize: percentOf(timeline, placement.span),
    blockStart: (placement.lane / laneCount) * 100,
    blockEnd: ((laneCount - 1 - placement.lane) / laneCount) * 100,
  };
}

type NamedRow = Pick<TimelineRow, "kind" | "depth"> & {
  readonly resource: { readonly title: string };
};

/** The accessible name of the list of a row's events. */
export const laneLabelOf = (row: Pick<NamedRow, "resource">) => `${row.resource.title} events`;

/** The accessible name of a row's disclosure: what pressing it does. */
export const disclosureLabelOf = (row: Pick<NamedRow, "resource">, expanded: boolean) =>
  `${expanded ? "Collapse" : "Expand"} ${row.resource.title}`;

/** What a row's disclosure belongs to: a group or a resource, and its level in the tree. */
export const disclosureDescriptionOf = (row: Pick<NamedRow, "kind" | "depth">) =>
  `${row.kind === "group" ? "Group" : "Resource"}, level ${row.depth + 1}`;
