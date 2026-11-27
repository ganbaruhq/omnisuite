# Resource timeline example

An editable shadcn composition of `@omnisuite/calendar-react`. It imports the calendar packages
through their built exports, as an application would, and owns every class, label and colour.

```sh
pnpm --filter "@omnisuite/calendar-*" build   # build calendar-core and calendar-react first
pnpm --filter @omnisuite/calendar-example dev   # http://localhost:3002
pnpm --filter @omnisuite/calendar-example test:browser
```

The page shows two compositions of the same calendar side by side ([Compositions](#compositions)).
The browser tests run the example in Chromium through Playwright. Install the browser once with
`pnpm --filter @omnisuite/calendar-example exec playwright install chromium`.

## Packages

- `@omnisuite/calendar-core` validates and lays out a timeline without React or the DOM.
  `decodeTimeline(input)` returns an Effect that fails with `TimelineInputError`;
  `decodeTimelineResult(input)` returns the same outcome synchronously as a `Result`.
  `timelineView(options)` and `timelineViewResult(options)` turn a preset into the range, slot
  size and time zone of that input.
- `@omnisuite/calendar-react` binds it to React: `useResourceTimeline(input)` returns
  `{ status: "ready", timeline, visibleRows, collapsedIds, toggleExpanded, editor, loading, resourceLoading }` or `{ status: "invalid", error }`, and `ResourceTimeline` holds
  the unstyled parts.

## Input

- Event and range endpoints are ISO 8601 datetimes with an offset (`2026-10-26T09:00Z`) or a
  named time zone (`2026-10-26T16:00[Asia/Ho_Chi_Minh]`). Dates or times alone are rejected.
- Intervals are `[start, end)` and must end after they start, so adjacent events share a boundary
  without overlapping.
- `slotDuration` is a positive ISO 8601 duration such as `PT1H` or `P1D`. Slots are generated from
  the start of the range; the end of the range cuts the last slot short.
- `timeZone` is the zone slots and labels are shown in (`UTC` unless set). Changing it never
  changes an event's instants. Years, months, weeks and days in a duration are calendar units of
  that zone, so a day lasts 23 or 25 hours across a daylight saving change, while `PT24H` is
  always 24 elapsed hours. A skipped hour has no slot; a repeated hour has two, both with
  `repeated: true` and told apart by `slot.start.offset`. The example labels them `01:00 GMT-4`
  and `01:00 GMT-5`, and `AxisSlot` sets `data-repeated`.
- A local time in a named zone that the zone skips moves forward across the gap, and one it
  repeats takes the earlier occurrence. `disambiguation` overrides this with `earlier`, `later`
  or `reject`. An endpoint with an offset names one instant and is not affected. An offset that
  contradicts its zone (`+01:00[Asia/Ho_Chi_Minh]`, `Z[America/New_York]`) is rejected, and so is
  a date with a zone but no time.
- Resource and event IDs are unique. Each `data` value is passed through untouched.
- An event lists one or more unique `resourceIds` and has one interval shared by all of them. It
  shows once under each loaded resource; an ID that names no loaded resource is kept in
  `timeline.events` and gets no row. An ID that names a group is rejected (see Hierarchy).
- Overlapping events are allowed, on any resource. Nothing checks availability.

## Occurrences and lanes

Each rendering of an event is an `EventPlacement` in `row.placements`. Its `event` is the one
shared event, so an update to the event reaches every occurrence; `occurrenceId` identifies the
rendering (the event and the resource), which the event's `id` alone does not.

Within a row, events are taken in order of start and then ID, and each gets the first lane that is
free when it starts, so events that touch at a boundary share a lane. A resource row's `laneCount` is the
number of lanes used, at least 1. The clipped position and `startsBefore`/`endsAfter` come from
the range; lanes are decided by the true endpoints.

## Hierarchy

`resources` is a flat node array. Set `kind: "group"` for an organizational heading and
`parentId` for its parent. Omit `kind` for an event-bearing resource. Omit `parentId` or use
`null` for a root. Parents can arrive after their children in the array, but all ancestors
must be included. Siblings retain their input order. Groups contain groups or resources;
resources contain resources and retain their own events. Events assigned to known groups,
duplicate node IDs, missing parents and cycles return `TimelineInputError`.

`timeline.rows` contains every node in preorder with `kind`, zero-based `depth` and
`hasChildren`. `visibleRows` filters collapsed descendants. All branches start expanded.
Call `toggleExpanded(id)` to toggle a branch. Descendants keep their state through ancestor
collapse, event updates and temporary removal from the input. Each hook instance owns its
expansion store. `visibleTimelineRows(rows, collapsedIds)` supplies the same pure traversal
for core-only consumers.

Render `GroupRow` for headings and `ResourceRow` with `Lane` for event targets. Only resource
rows have `data-resource-id`. Both kinds expose `data-kind` and `data-depth`. `Disclosure`
accepts `row`, `expanded` and `onExpandedChange` and renders a native button only for branches.
It names the action and node, exposes `aria-expanded`, and describes the node kind and level.
Enter and Space toggle it. Supply the button's content and focus styling locally.

## Composition

`ResourceTimeline.Root` sets `--timeline-span`, the range's width in slot units. Give `Axis` and
each `Lane` the same width, such as `w-[calc(var(--timeline-span)*7rem)]`; `AxisSlot` and `Event`
position themselves inside them by percentage, so the read-only view needs no measurement. `Lane`
sets `--timeline-lane-count`, so `min-height: calc(var(--timeline-lane-count) * 3.5rem)` lets the
row grow with its lanes; each `Event` takes its lane's share of the height, and margins on it
shrink it inside that share. An `Event` clipped by the range has `data-starts-before` or
`data-ends-after`; every `Event` has `data-event-id` and `data-occurrence-id`. Rows are labelled
groups and each lane is a list of its events, so give each `Event` an accessible name.

## Replacing the element of a part

Every part that renders one element takes `render`, so a locally owned component can be its host:
`Event`, `Preview`, `ResourceRow`, `GroupRow`, `Lane` and `Disclosure`.

```tsx
<ResourceTimeline.Event placement={placement} render={<Chip kind={event.data?.kind} />} aria-label={name} />
<ResourceTimeline.Disclosure row={row} expanded={expanded} onExpandedChange={toggle} render={<Button variant="ghost" size="icon-xs" />} />
<ResourceTimeline.ResourceRow row={row} render={(props) => <section {...props} />} />
```

- **An element** receives the part's props on top of its own, so `<Chip />` below is rendered as
  the host and keeps its own `className`, `style` and handlers. **A function** receives the part's
  props and returns the element; it must spread all of them onto one element (`ref`, handlers,
  `aria-*`, `data-*` and `style`), or the part loses what they carry.
- **Merged, not overwritten.** `ref`s are all called: the one the component takes, the consumer's
  `ref` on the part and the part's own (dnd-kit's draggable, row and lane registration, focus).
  A handler of the same name runs the element's first and the part's after it unless the event was
  prevented, so either can keep a key from starting an edit. `className`s are joined and `style`s
  merged with the part's placement on top; the part's role, `aria-*` and `data-*` win, so the
  accessible name, `aria-expanded`, `data-event-id` and the like cannot be lost.
- **Give the host a tag that fits.** An editable `Event` is focusable and takes the keyboard, so
  render it as a non-interactive element (`article`, `div`), never as a `button` or a link, and put
  no control inside it: `ResizeHandle` is hidden from assistive technology and cannot be focused,
  because resizing by keyboard is done on the event. A `Disclosure` is the one part that is a
  button, so the shared `Button` is a good host for it.
- The component must pass `ref` and the rest of its props to a DOM element. With React 19 `ref` is
  an ordinary prop, so `function Chip({ ref, ...props }) { return <article ref={ref} {...props} /> }`
  is enough. `Render` is exported for typing a prop that is forwarded to a part.

## Compositions

`useResourceTimeline` and the parts are the same in every composition; what differs is the markup
around them. Two live in `src`, and `src/showcase.tsx` mounts both:

|                | Front desk (`resource-timeline-example.tsx`)                   | Housekeeping (`housekeeping-example.tsx`)                                                |
| -------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Resource label | A sticky column beside each lane.                              | Above each lane, in a stacked section.                                                   |
| Toolbar        | Scale, navigation and time zone buttons under the card header. | Scale and navigation in the card header; no time zone control.                           |
| Hosts          | The parts' own elements.                                       | `section`, `header`, a local `Chip` component and the shared `Button`, through `render`. |
| Axis           | Part of the first row.                                         | Sticky at the top of the viewport.                                                       |

Both read their state from `useBoard` (`use-board.ts`), the application's side of one calendar: the
events it owns, the proposals it accepts and what its query functions have loaded. A new layout
only has to draw `state.visibleRows`, `timeline`, `editor`, `loading` and `resourceLoading`, and the
status parts for loading. `board-shared.tsx` holds the scales and the words both use. Together
they show nested groups and resources, events on a parent resource, an event shared by several
rooms, overlapping and one-hour events, controlled moving and resizing with an example-owned rule,
all three kinds of incremental loading (event windows, resource pages and lazily loaded children) and
a scoped Retry for a window and for a branch. Each of them has its own query caches, so a failure
in one is not a failure in the other.

Two calendars on one page share nothing. Each owns its gesture and preview, its expansion state,
its scroll position, focus and the observations it handed to the application; a shared query
cache is cancelled only when the last calendar that observes a request leaves.
`compositions.browser.test.tsx` mounts both and checks it. The calendar has no selection of its
own: an event is selected by focusing it, and focus is per element.

Viewing on a phone scrolls inside each calendar's viewport and never across the page: the toolbars
wrap and the board is `overflow: auto` in its own box. Editing with the mouse and the keyboard is
unchanged on a desktop. There is no snap-step selector, no built-in details popover and no touch
editing control.

## Presets

`timelineViewResult({ preset, anchor, timeZone })` returns `{ range, slotDuration, timeZone }` to
spread into the timeline input. The preset is the scale: its default slot is one unit of it and
the range starts at the beginning of the unit that holds `anchor` in the display zone.

| Preset  | Slot   | Visible | Range starts at              |
| ------- | ------ | ------- | ---------------------------- |
| `hour`  | `PT1H` | `P1D`   | the hour of the anchor       |
| `day`   | `P1D`  | `P1W`   | local midnight               |
| `week`  | `P1W`  | `P4W`   | local midnight on the Monday |
| `month` | `P1M`  | `P1Y`   | local midnight on the 1st    |

`visible` and `slotDuration` override the defaults independently. The `views` table in
`resource-timeline-example.tsx` is where this example sets them.

## Moving and resizing events

Timelines are read-only. Pass `editing` to `useResourceTimeline` and the returned `editor` to
`Root` to let events be moved or resized; the calendar proposes changes and never makes them, so the
application owns the events and decides what becomes of each proposal.

```tsx
const state = useResourceTimeline({
  ...view,
  resources,
  events,
  editing: {
    snap: "PT30M",
    startEditable: true,
    resourceEditable: true,
    durationEditable: true,
  },
  onProposal: (proposal) => setEvents(apply(proposal.after)), // or ignore it
});
// <ResourceTimeline.Root timeline={state.timeline} editor={state.editor}>
```

- `snap` is required and has no default: an ISO 8601 duration in one unit (`PT15M`, `PT1H`,
  `P1D`, `P1W`, `P1M`, `P1Y`). The grid is aligned to the calendar, not to the loaded range or the
  scroll position: hours and shorter count from local midnight, days from 1970-01-01, weeks from
  Monday, months and years from January 1970. A start goes to the nearest boundary, a tie to the
  later one. `startEditable` and `resourceEditable` turn on moving in time and between rows, and
  `durationEditable` turns on resizing; an event's own `startEditable` / `resourceEditable` /
  `durationEditable` overrides each. The three are independent: an event may be resizable but
  not movable. `data-movable` and `data-resizable` on an event say which it is.
- **Pointer.** Hold the pointer on an event (200 ms, within 8 px) and drag. A click does nothing of
  its own. The original rendering is hidden (`data-dragging`) and `Preview` draws the destination
  in the row under the pointer, found by measuring the rendered rows, so rows of any height work
  and group headings and collapsed rows are not targets. Releasing on a changed, allowed
  destination calls `onProposal` once; Escape, releasing outside a row, or releasing a destination
  a rule rejects emits nothing.
- **Keyboard.** Enter or Space on a focused event starts a move; left and right arrows change the
  start by one snap step, up and down arrows change the row, Enter or Space proposes it, Escape
  cancels, and leaving the event cancels. Focus stays on the moved event. A `keydown` handler that
  calls `preventDefault` keeps a key for the application. Shift with a left or right arrow starts
  resizing the end, Alt with one starts resizing the start; the arrows then move that edge by one
  snap step from where it began, and Enter, Space, Escape and leaving the event end it as for a
  move. This works for events too narrow to grab, and `aria-keyshortcuts` names the keys.
- **Resizing.** Render `ResourceTimeline.ResizeHandle edge="start"` and `edge="end"` inside an
  `Event`; style them, since they are unstyled absolutely positioned strips at the event's edges.
  A handle renders only when the event can be resized and only at an actual endpoint, never where
  the visible range clips the event. Pressing a handle starts a resize at once, with no hold;
  `Root` has `data-operation="resize"` meanwhile. The dragged edge snaps to the same grid as a move
  and follows the pointer along the time axis wherever it is vertically; the opposite edge and the
  resources stay fixed, even when they are off the grid. An edge dragged past the opposite one stops
  at the nearest grid boundary on the allowed side of it, so the interval stays positive, but never
  moves against the drag (then the edge stays); there is no other minimum. A gesture inside the cell the edge already snaps to changes nothing. The
  proposal has `operation: "resize"` and `edge`, with the whole interval in `before` and `after`;
  for a shared event the interval changes for every resource. The rules below apply exactly as
  for a move.
- **What moves.** The start snaps to the grid and the end follows, keeping the elapsed duration
  (09:10–10:20 moved to a 09:30 start ends at 10:40). A gesture that stays within the grid cell of
  the original start changes nothing and does not round it. Day and week moves use calendar
  arithmetic in the display zone and hour and minute moves use elapsed time, so the preview and
  the proposal's UTC `before` / `after` agree across daylight saving changes. Moving an event
  shared by resources drops the dragged resource and adds the target if the event is not on it
  already: A from A+B to C gives B+C, and A onto B gives B.
- **Rules.** The calendar has none of its own. `editing.constraint` (an interval or a list, each
  optionally limited to some resources), `editing.overlap(stationary, moving)` and
  `editing.allow(proposal, { events })` are evaluated in that order against the proposal the
  preview shows. A rejected destination shows a not-allowed preview (`data-not-allowed`) and its
  description says so. A rule that throws rejects the destination and is reported to
  `onRuleError`. Rules never reject events you supply, only changes. They see only the loaded
  events. This example's rule is that two stays cannot share a room.
- **Announcements.** `Preview` is named by a description of the destination and `Status` is a
  polite live region with the same text, then how the move ended. The default is English; pass
  `describe` to `useResourceTimeline` for other words.
- **Cancellation.** A move or resize is also cancelled, without a proposal, if the dragged event is removed
  or changes under it, or if the calendar unmounts. `Root` has `data-gesture` while a move is in
  progress and `data-cancel-reason` after a cancelled one.

Each calendar keeps its gesture in its own `@xstate/store` store (`editGestureLogic` in
`calendar-core`), which never holds the events. dnd-kit supplies only the pointer sensor.

## Loading windows

The calendar never fetches, caches, deduplicates, cancels or retries. Navigating changes the
`range` you pass, and the window that range covers is the unit of loading. Give
`useResourceTimeline` a `loading` option and the application's query functions do the rest:

```tsx
const state = useResourceTimeline({
  ...view,
  resources,
  events, // everything loaded so far, from every window
  loading: {
    coverage, // what you know about each window, by window.key
    onLoadWindow: (window, { retry }) => query.observe(window, { retry }), // returns a release function
  },
});
// state.loading: { window, state, retry() }
// <ResourceTimeline.WindowStatus loading={state.loading}>{(loading) => …}</ResourceTimeline.WindowStatus>
```

- **The signal.** `onLoadWindow` receives a `TimelineWindow`: `range` (`[start, end)` as UTC
  instants), `timeZone`, `resourceScope` (the sorted IDs of the resource rows, never groups) and a
  `key` made from all three. It is called from an effect after React commits, never while
  rendering, once for each window shown. Re-rendering with the same window, or with other events,
  does not signal again, and a window that failed is signalled again only by `loading.retry()`
  (with `retry: true`, and only while the window has `failed`).
- **Coverage.** `coverage` is keyed by `window.key`: `pending`, `loaded`, `loaded-empty` or
  `failed` (with the application's `error`). A window missing from it is `unknown`, which is not
  `loaded-empty`: only the application knows a window was loaded and held nothing. The calendar
  reads the entry for the window it is showing and no other, so a response for a window the viewer
  has left is stored under its own key and cannot replace the current window. Leave a cancelled
  request out of `coverage` rather than reporting it as `failed`.
- **What to load.** `intersectsWindow(window, event)` is `true` for every event that intersects
  `[start, end)`, including one that starts before the window and ends inside it, and `false` for
  one that only touches a boundary. A window's loader should return exactly those events.
- **Content stays.** The calendar renders the `events` you supply whatever the coverage is, so
  loading or a failure never blanks the board. `WindowStatus` is a polite live region with
  `data-status` that you place beside the lanes it describes (the example puts it under the axis);
  its children are a function of `{ window, state, retry }` for a placeholder, a message or a
  Retry button.
- **Cleanup.** `onLoadWindow` may return a function that ends the observation. It runs when the
  shown window changes, before a retry, and when the timeline unmounts. The calendar closes an
  Effect `Scope` around it (`observeWindow` in `calendar-core` is the same operation as an Effect,
  for Effect callers) and never aborts anything itself. Whether the request behind an observation
  is cancelled is the application's decision: `createWindowQueries` in `src/window-queries.ts`
  aborts a request only when its last observer leaves, so a second timeline on the same window
  keeps its data. An observer that throws is reported to React as the error it threw.

`src/window-queries.ts` is the query-style integration: a cache keyed by window, one request per
window however many timelines observe it, an `AbortSignal` per request, retry on demand, and
`subscribe`/`getSnapshot` for `useSyncExternalStore`. It depends on nothing but the calendar's
types, so TanStack Query, SWR or an Effect service can stand in for it; none is a dependency of
either calendar package. The example's `queries` prop turns it on, and the browser tests drive it
with a fetch that answers only when the test says so, to control response order and failures.

## Loading resources

Resources load the same way events do: the application owns the queries, the cursors and the
cache, and the calendar only says which list it needs a page of. A _scope_ is one list of
resources, either the top level of the tree or the children of one parent, and each scope has its
own cursor, `hasMore`, pending state and failure.

```tsx
const state = useResourceTimeline({
  ...view,
  resources, // everything loaded so far, from every page and every parent
  events,
  resourceLoading: {
    coverage, // what you know about each scope, by scope.key
    onLoad: ({ scope, cursor }, { retry }) => query.observe(scope, cursor, { retry }), // returns a release function
  },
});
// state.resourceLoading: { list, branch(parentId), listEnd }  each scope: { scope, state, hasMore, retry(), loadMore() }
// <ResourceTimeline.ListEnd loading={state.resourceLoading} />         after the last row
// <ResourceTimeline.ScopeStatus scope={state.resourceLoading.branch(id)}>{(scope) => …}</ResourceTimeline.ScopeStatus>
```

- **Children to load.** Give a group or resource `lazyChildren: true` when it has children that
  are loaded on demand. It can be expanded before any child exists, and it starts collapsed.
  Nothing is requested for it until the viewer expands it, whether it is a group or a resource
  with child resources. Without the flag a node is open by default and the calendar never asks for
  its children.
- **The signal.** `onLoad` receives a `ResourceRequest`: the `scope` (`parentId` is `null` for the
  top level) and the `cursor` you reported for it. It is called from an effect after React
  commits, once for each page asked for, and never while rendering. The top level is asked for
  when `ResourceTimeline.ListEnd`, which you render after the last row inside the viewport, is in
  view, so scrolling to the bottom loads another page and a page too short to fill the viewport
  loads one more. A parent's children are asked for, first page only, when it is expanded. Later
  pages of a branch are asked for by `branch(id).loadMore()`.
- **Cursors are yours.** The calendar never reads one. Report `cursor` in the scope's coverage and
  it comes back untouched in the next request. After a `failed` page, report the cursor that
  failed so a retry asks for the same page.
- **Coverage.** `coverage` is keyed by `scope.key` (`resourceScopeOf(parentId).key`): `pending`,
  `loaded` (with `hasMore` and `cursor`), `loaded-empty` or `failed` (with `error`). A scope
  missing from it is `unknown`, which is not `loaded-empty`: an unknown branch is requested when
  it opens and a branch that loaded empty is not. Report the page you supplied as `loaded`; an
  unreported top level is requested as soon as its end is in view.
- **No repeats.** A scope is not asked for while it is `pending`, after it has `failed` (only
  `retry()` asks again, with `retry: true`), after a terminal page (`hasMore` false or missing),
  or when it is `loaded-empty`. Observing the viewport again, or rendering again, does not signal
  a request that was already signalled. Each scope has one observation at a time.
- **Context stays.** Expansion is the viewer's own and is kept per node: it survives children
  arriving and an ancestor collapsing and reopening. Rows keep their elements, so scroll position
  is untouched while a page arrives. A failure shows in its own `ScopeStatus` beside the rows it
  concerns and never hides what is loaded. An event that names a resource not yet loaded is kept
  and shows under every one of its resources as each loads.
- **Collapse before the response.** Collapsing a branch, or one of its ancestors, ends its
  observation: `onLoad`'s release function is called, and the calendar stops showing that scope. A
  response that arrives later fills your cache, reports `loaded` under that scope, and changes
  nothing visible: the branch stays collapsed and the children cannot appear under another parent,
  because each resource carries its own `parentId`. Expanding it again finds them loaded and asks
  for nothing.
- **Cleanup.** The release function runs when the page changes, when the branch collapses and when
  the timeline unmounts. `observeResourceRequest` in `calendar-core` is the same operation as an
  Effect, for Effect callers. Whether a request is cancelled is the application's decision:
  `createResourceQueries` in `src/resource-queries.ts` lets a request that nobody observes any
  more finish into its cache.

`src/resource-queries.ts` is the query-style integration, and `createSampleResourceFetch` a stand-in
server with opaque cursors. The example's `resourceQueries` prop turns it on, and the browser tests
drive it with a fetch that answers only when the test says so, to control order and failures.

## Dataset size

The first release is verified with 100 resources and 1,000 unique events, and with a second fixture
whose 1,000 events each name two resources. `src/dataset.ts` generates both deterministically: rooms
in floors of ten, events of one to thirty-six hours on the hour across one week, overlapping in
several lanes, every event inside the range. Events and placements are different numbers:

| Fixture           | Resources           | Unique events | Placements (`[data-timeline-event]`) |
| ----------------- | ------------------- | ------------- | ------------------------------------ |
| `baselineDataset` | 100 (and 10 floors) | 1,000         | 1,000                                |
| `sharedDataset`   | 100 (and 10 floors) | 1,000         | 2,000                                |

`resource-timeline-dataset.browser.test.tsx` checks the same behavior as the small boards at this
size: every placement is rendered once inside its lane and lanes do not overlap; the first and last
rows and both ends of the week are reachable by scrolling; collapsing and expanding a floor removes
and restores exactly its placements; a keyboard move, a held pointer drag to another row and a
resize by handle give the proposals a small board gives, and the controlled result is rendered; a
shared event's two renderings share one interval and move together; and 100 resources paged in 25s
as the list is scrolled, with a terminal page that stops further requests, load the week's 1,000
events through query functions, while another week is loaded-empty and the first returns from the
cache. These runs render every row and event without virtualization.

No latency target was agreed, so the tests assert correctness and never time. The times below were
observed once with `pnpm --filter @omnisuite/calendar-example exec vp test run
src/resource-timeline-dataset.browser.test.tsx --silent=false`, which prints a `[dataset]` line for
every scenario. They are milliseconds from the start of a step to the end of the next two animation
frames, and vary by tens of percent between runs; treat them as the order of magnitude on this
machine, not as a promise.

- **Environment.** Windows 11 Pro 10.0.22000, 12th Gen Intel Core i5-12600K (16 logical cores),
  32 GB of memory, headless Chromium 156.0.8078.4 from Playwright, viewport 1280 × 900 (800 × 900
  where a horizontal scroll was needed), device pixel ratio 1. The page held 4,622 DOM nodes with
  1,000 placements and 8,622 with 2,000; the JS heap was about 78 MB.
- **Baseline (100 resources, 1,000 placements).** First render 240–420. Scrolling to the last row,
  to the end of the week and back: about 33 each. Collapsing a floor 160–190, expanding it 170–220.
  A keyboard move 580 (focusing the event and three key presses sent through the test driver), a pointer
  move to another row 620 (including three fixed 30 ms waits) and a pointer resize 470 (the same).
- **Shared (1,000 events, 2,000 placements).** First render 520–610. Collapsing a floor 280 and
  expanding it 430. A keyboard move of an event with two renderings 1,070, with both renderings
  updated.
- **Loading (100 resources in four pages of 25, then 1,000 events).** The list reached 100 rooms and
  the 1,000 events appeared about 1.7 s after the first scroll, with no delay in the stand-in
  server (each page changes the resource scope, which is part of a window's key, so the events are
  asked for again for the larger scope). The next empty week took 200 and the return to the cached
  week 280.

The calendar holds no copy of the events, so a consumer whose own board is slower than this should
start with what its `onProposal` and its query functions do.
