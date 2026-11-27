import { useState } from "react";
import { HousekeepingExample } from "./housekeeping-example";
import { createResourceQueries, createSampleResourceFetch } from "./resource-queries";
import { ResourceTimelineExample } from "./resource-timeline-example";
import { lazyServerEvents, lazyServerResources, sampleEditing } from "./sample-timeline";
import { createSampleFetch, createWindowQueries } from "./window-queries";

/**
 * The application's side of one calendar: queries for event windows, resource pages and lazy
 * children. A stand-in server fails the first request for any window from 2 November 2026 on and
 * the first request for the annex's children, so that retrying a window and a branch can be tried.
 * Every call makes caches of its own, so two calendars share no data and no failure.
 */
function useQueries() {
  const [queries] = useState(() => ({
    events: createWindowQueries(
      createSampleFetch(lazyServerEvents, { failUntilRetry: "2026-11-02T00:00" }),
    ),
    resources: createResourceQueries(
      createSampleResourceFetch(lazyServerResources, { pageSize: 5, failFirst: ["annex"] }),
    ),
  }));
  return queries;
}

/**
 * Two compositions of the same calendar on one page. They use the same packages and the same kind of
 * data, and share nothing: scrolling, expanding, previewing, focus and loading belong to each
 * calendar alone.
 */
export function Showcase() {
  const frontDesk = useQueries();
  const housekeeping = useQueries();
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
      <ResourceTimelineExample
        input={{ resources: [], events: lazyServerEvents }}
        editing={sampleEditing}
        queries={frontDesk.events}
        resourceQueries={frontDesk.resources}
      />
      <HousekeepingExample
        input={{ resources: [], events: lazyServerEvents }}
        editing={sampleEditing}
        queries={housekeeping.events}
        resourceQueries={housekeeping.resources}
      />
    </main>
  );
}
