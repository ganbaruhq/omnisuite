import type { EditEvaluation, EditRule, EventProposal } from "./editing.js";
import type { CalendarEvent } from "./event.js";
import type { EditCancelReason, EditOperation } from "./gesture.js";
import type { Timeline } from "./timeline.js";

/** What a preview shows, for describing it to someone who cannot see it. */
export interface PreviewDescription<TEventData = unknown> {
  /** `unchanged` is the event staying where it is; `rejected` is a destination that is not allowed. */
  readonly status: "allowed" | "unchanged" | "rejected";
  /** The rule that rejected the destination. */
  readonly rule?: EditRule;
  /** What the rule threw, when it threw instead of answering. */
  readonly error?: unknown;
  readonly proposal: EventProposal<TEventData>;
  readonly title: string;
  /** The titles of the resources the event would be on. */
  readonly resourceTitles: readonly string[];
  readonly timeZone: string;
}

/**
 * What a renderer hands to `describe` for a proposal: the event's title, the titles of the
 * resources it would be on (the id when a resource is not in the timeline) and the time zone.
 */
export function previewDescriptionOf<TEventData>(
  timeline: Pick<Timeline<any, any>, "rows" | "timeZone"> | undefined,
  status: PreviewDescription["status"],
  proposal: EventProposal<TEventData>,
  rejection?: { readonly rule: EditRule; readonly error?: unknown },
): PreviewDescription<TEventData> {
  const titles = new Map(timeline?.rows.map(({ resource }) => [resource.id, resource.title]));
  return {
    status,
    proposal,
    title: proposal.after.title,
    resourceTitles: proposal.after.resourceIds.map((id) => titles.get(id) ?? id),
    timeZone: timeline?.timeZone ?? "UTC",
    ...(rejection && { rule: rejection.rule, error: rejection.error }),
  };
}

const dateFormat = (timeZone: string) =>
  new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone });

const ruleText: Record<EditRule, string> = {
  constraint: "outside the allowed times",
  overlap: "overlaps another event",
  allow: "not permitted",
};

/** The default, English description of a preview. */
export function describePreviewInEnglish(preview: PreviewDescription<any>): string {
  const format = dateFormat(preview.timeZone);
  const when = `${format.format(Date.parse(preview.proposal.after.start))} to ${format.format(
    Date.parse(preview.proposal.after.end),
  )}`;
  const where = preview.resourceTitles.join(", ");
  if (preview.status === "rejected") {
    const why = preview.error !== undefined ? "a rule failed" : ruleText[preview.rule!];
    return `Not allowed: ${preview.title} on ${where}, ${when} (${why})`;
  }
  if (preview.status === "unchanged") return `${preview.title} stays on ${where}, ${when}`;
  return preview.proposal.operation === "resize"
    ? `Resize the ${preview.proposal.edge} of ${preview.title} on ${where}, ${when}`
    : `Move ${preview.title} to ${where}, ${when}`;
}

/** What to announce when a gesture is cancelled. */
export function cancelMessageOf(operation: EditOperation, reason: EditCancelReason): string {
  const action = operation === "resize" ? "Resize" : "Move";
  switch (reason) {
    case "escape":
    case "blur":
      return `${action} cancelled.`;
    case "invalid-target":
      return `${action} cancelled: not over a resource.`;
    case "rejected":
      return `${action} cancelled: that ${operation === "resize" ? "interval" : "destination"} is not allowed.`;
    case "event-removed":
      return `${action} cancelled: the event was removed.`;
    case "event-changed":
      return `${action} cancelled: the event changed.`;
  }
}

/** What to announce when a gesture ends where it began. */
export const unchangedMessageOf = (operation: EditOperation, title: string) =>
  `${title} was not ${operation === "resize" ? "resized" : "moved"}.`;

/** What to announce while a gesture has no destination, such as a pointer outside every row. */
export const untargetedMessageOf = (operation: EditOperation, title: string) =>
  `${operation === "resize" ? "Resizing" : "Moving"} ${title}: not over a resource.`;

/**
 * Identifies an event's values, so that a change under a gesture can be told from a re-render:
 * the gesture keeps the fingerprint it began with, and a different one cancels it.
 */
export const editFingerprintOf = (event: CalendarEvent<any>) =>
  JSON.stringify([
    event.id,
    event.title,
    event.start.toString(),
    event.end.toString(),
    event.resourceIds,
    event.startEditable,
    event.resourceEditable,
    event.durationEditable,
    event.constraint?.map(({ start, end, resourceIds }) => [
      start.toString(),
      end.toString(),
      resourceIds,
    ]),
    event.overlap,
  ]);

/**
 * Identifies what an evaluation shows, so a renderer can skip updating the preview when the
 * pointer or a step lands on the same result. Undefined is the empty key.
 */
export const evaluationKeyOf = (evaluation: EditEvaluation<any> | undefined) => {
  if (!evaluation) return "";
  if (evaluation.status === "unavailable") return `unavailable:${evaluation.reason}`;
  const { targetResourceId, after } = evaluation.proposal;
  return JSON.stringify([
    evaluation.status,
    evaluation.status === "rejected" ? evaluation.rule : "",
    evaluation.status === "rejected" && evaluation.error !== undefined,
    targetResourceId,
    after.start,
    after.end,
    after.resourceIds,
  ]);
};
