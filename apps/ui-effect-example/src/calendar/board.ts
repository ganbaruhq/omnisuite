import type { ResourceScopeLoading } from "@omnisuite/calendar-effect";
import type {
  CalendarEvent,
  TimelinePreset,
  TimelineRow,
  TimelineSlot,
  TimelineView,
  TimelineViewOptions,
} from "@omnisuite/calendar-core";
import { Temporal } from "temporal-polyfill";

// The toolbar's arithmetic and the words of the React example's `board-shared.tsx`, so both
// examples offer the same scales and say the same things. Markup and classes stay in the page.

/** The scales and time zones the toolbar offers. */
export const presets = ["hour", "day", "week", "month"] as const;
export const timeZones = ["UTC", "Asia/Ho_Chi_Minh", "America/New_York"] as const;

/** How much each scale shows: the length of the range and of one slot. */
export const views: Record<
  TimelinePreset,
  Pick<TimelineViewOptions, "visible" | "slotDuration">
> = {
  hour: { visible: "P1D", slotDuration: "PT1H" },
  day: { visible: "P1W", slotDuration: "P1D" },
  week: { visible: "P4W", slotDuration: "P1W" },
  month: { visible: "P1Y", slotDuration: "P1M" },
};

export const timeOf = (instant: CalendarEvent["start"], timeZone: string) =>
  instant.toZonedDateTimeISO(timeZone).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

/** The text of an axis slot: a line that names the date and one for the time or unit. */
export function slotLabel(
  preset: TimelinePreset,
  slot: TimelineSlot,
  previous: TimelineSlot | undefined,
) {
  const { start } = slot;
  switch (preset) {
    case "hour":
      return {
        top:
          !previous || !previous.start.toPlainDate().equals(start.toPlainDate())
            ? start.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short" })
            : "",
        bottom: start.toLocaleString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          ...(slot.repeated && { timeZoneName: "short" }),
        }),
      };
    case "day":
      return {
        top: start.toLocaleString("en-GB", { weekday: "short" }),
        bottom: String(start.day),
      };
    case "week":
      return {
        top: "Week of",
        bottom: start.toLocaleString("en-GB", { day: "numeric", month: "short" }),
      };
    case "month":
      return {
        top: String(start.year),
        bottom: start.toLocaleString("en-GB", { month: "short" }),
      };
  }
}

/** What the example says about a window that is not loaded with events, and not failed. */
export const windowText = {
  unknown: "Events for this window have not been requested.",
  pending: "Loading events for this window…",
  "loaded-empty": "No stays or maintenance in this window.",
} as const;

/**
 * Where a lazy parent's children end among the visible rows: the status of that branch goes just
 * after its last descendant, so that "Load more" sits below the children it would add to. Parents
 * nested in each other end at the same row, innermost first.
 */
export function branchEnds(rows: readonly TimelineRow[], collapsedIds: ReadonlySet<string>) {
  const ends = new Map<number, TimelineRow[]>();
  rows.forEach((row, index) => {
    if (!row.resource.lazyChildren || collapsedIds.has(row.resource.id)) return;
    let last = index;
    while (rows[last + 1] && rows[last + 1]!.depth > row.depth) last += 1;
    ends.set(last, [row, ...(ends.get(last) ?? [])]);
  });
  return ends;
}

/** What the example says about a branch that is not simply loaded, and the action it offers. */
export function scopeText(branch: ResourceScopeLoading, title: string) {
  switch (branch.state.status) {
    case "pending":
      return { message: "Loading…" };
    case "failed":
      return {
        message: `Could not load what is under ${title}.`,
        action: { verb: "Retry", label: "Retry loading", kind: "retry" as const },
      };
    case "loaded-empty":
      return { message: `Nothing to show under ${title}.` };
    case "loaded":
      return branch.hasMore
        ? {
            message: "More are available.",
            action: { verb: "Load more", label: "Load more under", kind: "more" as const },
          }
        : undefined;
    default:
      return undefined;
  }
}

/** The range as text in its own time zone. */
export function rangeOf({ range, timeZone }: Pick<TimelineView, "range" | "timeZone">) {
  const text = (datetime: string) =>
    new Date(datetime.split("[")[0]!).toLocaleDateString("en-GB", {
      timeZone,
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  return `${text(range.start)} – ${text(range.end)} (${timeZone})`;
}

/** A moment inside the window before or after the one shown, in the time zone shown. */
export function adjacentAnchor(view: TimelineView, preset: TimelinePreset, direction: -1 | 1) {
  return direction > 0
    ? view.range.end
    : Temporal.ZonedDateTime.from(view.range.start).subtract(views[preset].visible!).toString();
}
