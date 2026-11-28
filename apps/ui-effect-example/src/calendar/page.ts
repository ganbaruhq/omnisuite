import type { Html } from "@effect/ui/html";
import { FrontDesk } from "./front-desk";
import {
  createResourceQueries,
  createSampleResourceFetch,
} from "@omnisuite/calendar-sample-data/resource-queries";
import {
  lazyServerEvents,
  lazyServerResources,
  sampleEditing,
  sampleTimeline,
} from "@omnisuite/calendar-sample-data/sample-timeline";
import {
  createSampleFetch,
  createWindowQueries,
} from "@omnisuite/calendar-sample-data/window-queries";

/**
 * The application's side of the calendar: queries for event windows. As in the React example, a
 * stand-in server fails the first request for any window from 2 November 2026 on, so that
 * retrying a window can be tried.
 */
const queries = createWindowQueries(
  createSampleFetch(sampleTimeline.events, { failUntilRetry: "2026-11-02T00:00" }),
);

/**
 * A second calendar with queries of its own: the rooms load a page or a branch at a time, and the
 * stand-in server fails the first request for the annex's children, so that retrying a branch can
 * be tried. Its events move and resize
 * too.
 */
const lazy = {
  events: createWindowQueries(
    createSampleFetch(lazyServerEvents, { failUntilRetry: "2026-11-02T00:00" }),
  ),
  resources: createResourceQueries(
    createSampleResourceFetch(lazyServerResources, { pageSize: 5, failFirst: ["annex"] }),
  ),
};

/**
 * The resource timeline, loading its events window by window, and a second one loading its rooms
 * too. Their stays move and resize by the hour, and the page accepts every change the hostel's
 * rule allows.
 */
export const CalendarPage = <Msg>(h: Html.H<Msg>) =>
  h.div.class("space-y-6 p-4 sm:p-8").children(
    FrontDesk(h, { props: { input: sampleTimeline, queries, editing: sampleEditing } }),
    FrontDesk(h, {
      key: "housekeeping",
      props: {
        title: "Housekeeping",
        input: { resources: [], events: lazyServerEvents },
        queries: lazy.events,
        resourceQueries: lazy.resources,
        editing: sampleEditing,
      },
    }),
  );
