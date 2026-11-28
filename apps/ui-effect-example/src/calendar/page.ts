import type { Html } from "@effect/ui/html";
import { FrontDesk } from "./front-desk";
import { sampleEditing, sampleTimeline } from "./sample-timeline";
import { createSampleFetch, createWindowQueries } from "./window-queries";

/**
 * The application's side of the calendar: queries for event windows. As in the React example, a
 * stand-in server fails the first request for any window from 2 November 2026 on, so that
 * retrying a window can be tried.
 */
const queries = createWindowQueries(
  createSampleFetch(sampleTimeline.events, { failUntilRetry: "2026-11-02T00:00" }),
);

/**
 * The resource timeline, loading its events window by window. Its stays move and resize by the
 * hour, and the page accepts every change the hostel's rule allows.
 */
export const CalendarPage = <Msg>(h: Html.H<Msg>) =>
  h.div
    .class("p-4 sm:p-8")
    .children(FrontDesk(h, { props: { input: sampleTimeline, queries, editing: sampleEditing } }));
