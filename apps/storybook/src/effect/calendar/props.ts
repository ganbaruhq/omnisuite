import type { Component } from "@effect/ui";
import { FrontDesk } from "./front-desk";
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
import {
  createResourceQueries,
  createSampleResourceFetch,
} from "@omnisuite/calendar-sample-data/resource-queries";

export type BoardProps = Component.Props<typeof FrontDesk>;

export function frontDeskProps(): BoardProps {
  return {
    input: sampleTimeline,
    queries: createWindowQueries(
      createSampleFetch(sampleTimeline.events, { failUntilRetry: "2026-11-02T00:00" }),
    ),
    editing: sampleEditing,
  };
}

export function housekeepingProps(): BoardProps {
  return {
    title: "Housekeeping",
    input: { resources: [], events: lazyServerEvents },
    queries: createWindowQueries(
      createSampleFetch(lazyServerEvents, { failUntilRetry: "2026-11-02T00:00" }),
    ),
    resourceQueries: createResourceQueries(
      createSampleResourceFetch(lazyServerResources, { pageSize: 5, failFirst: ["annex"] }),
    ),
    editing: sampleEditing,
  };
}
