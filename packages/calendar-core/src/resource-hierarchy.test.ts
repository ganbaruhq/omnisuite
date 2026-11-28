import { Result } from "effect";
import { describe, expect, it } from "vite-plus/test";
import {
  decodeTimelineResult,
  expansionToggleOf,
  resourceHierarchyLogic,
  visibleTimelineRows,
  type CalendarNodeInput,
  type TimelineInput,
} from "./index.js";

const resources: readonly CalendarNodeInput[] = [
  { id: "hostel", title: "Hostel", kind: "group" },
  { id: "floor", title: "Floor", kind: "group", parentId: "hostel" },
  { id: "room", title: "Room", parentId: "floor" },
  { id: "bed", title: "Bed", parentId: "room" },
  { id: "other", title: "Other" },
];
const input = (nodes = resources): TimelineInput => ({
  range: { start: "2026-10-26T00:00Z", end: "2026-10-27T00:00Z" },
  slotDuration: "P1D",
  resources: nodes,
  events: [
    {
      id: "parent-stay",
      title: "Parent stay",
      resourceIds: ["room"],
      start: "2026-10-26T09:00Z",
      end: "2026-10-26T10:00Z",
    },
    {
      id: "bed-stay",
      title: "Bed stay",
      resourceIds: ["bed"],
      start: "2026-10-26T09:00Z",
      end: "2026-10-26T10:00Z",
    },
  ],
});
const timelineOf = (value: unknown) => {
  const result = decodeTimelineResult(value);
  if (Result.isFailure(result)) throw result.failure;
  return result.success;
};
const issuesOf = (value: unknown) => {
  const result = decodeTimelineResult(value);
  if (Result.isSuccess(result)) throw new Error("Expected invalid hierarchy");
  return result.failure.issues;
};

it("distinguishes group headings from resource event rows and exposes depth", () => {
  const timeline = timelineOf(input());
  expect(
    timeline.rows.map((row) => [row.resource.id, row.kind, row.depth, row.hasChildren]),
  ).toEqual([
    ["hostel", "group", 0, true],
    ["floor", "group", 1, true],
    ["room", "resource", 2, true],
    ["bed", "resource", 3, false],
    ["other", "resource", 0, false],
  ]);
  expect(timeline.rows[0]!.placements).toEqual([]);
  expect(timeline.rows[1]!.placements).toEqual([]);
  expect(timeline.rows[2]!.placements.map(({ event }) => event.id)).toEqual(["parent-stay"]);
  expect(timeline.rows[3]!.placements.map(({ event }) => event.id)).toEqual(["bed-stay"]);
});

it("retains descendant expansion and parent events through ancestor collapse/reopen", () => {
  const timeline = timelineOf(input());
  const store = resourceHierarchyLogic.createStore();
  const visible = () =>
    visibleTimelineRows(timeline.rows, store.getSnapshot().context.collapsedIds);
  store.trigger.toggleExpanded({ id: "room" });
  expect(visible().map((row) => row.resource.id)).toEqual(["hostel", "floor", "room", "other"]);
  expect(visible()[2]!.placements.map(({ event }) => event.id)).toEqual(["parent-stay"]);
  store.trigger.toggleExpanded({ id: "hostel" });
  expect(visible().map((row) => row.resource.id)).toEqual(["hostel", "other"]);
  store.trigger.toggleExpanded({ id: "hostel" });
  expect(visible().map((row) => row.resource.id)).toEqual(["hostel", "floor", "room", "other"]);
  expect(store.getSnapshot().context.collapsedIds.has("room")).toBe(true);
  store.trigger.toggleExpanded({ id: "room" });
  expect(visible().map((row) => row.resource.id)).toEqual([
    "hostel",
    "floor",
    "room",
    "bed",
    "other",
  ]);
  expect(timeline.rows).toHaveLength(5);
  expect(timeline.events).toHaveLength(2);
});

it("keeps sibling input order and treats null parents as roots", () => {
  const timeline = timelineOf(
    input([
      { id: "bed-b", title: "B", parentId: "room" },
      { id: "room", title: "Room", parentId: null },
      { id: "bed-a", title: "A", parentId: "room" },
    ]),
  );
  expect(timeline.rows.map((row) => row.resource.id)).toEqual(["room", "bed-b", "bed-a"]);
});

it("traverses a 10,000-level hierarchy without recursive call limits", () => {
  const nodes = Array.from({ length: 10_000 }, (_, index) => ({
    id: `node-${index}`,
    title: `${index}`,
    parentId: index === 0 ? null : `node-${index - 1}`,
  })).reverse();
  const timeline = timelineOf(input(nodes));
  expect(timeline.rows).toHaveLength(10_000);
  expect(timeline.rows[9_999]!.depth).toBe(9_999);
  expect(
    visibleTimelineRows(timeline.rows, new Set(["node-0"])).map((row) => row.resource.id),
  ).toEqual(["node-0"]);
});

it("rejects a 10,000-node cycle without recursive call limits", () => {
  const nodes = Array.from({ length: 10_000 }, (_, index) => ({
    id: `node-${index}`,
    title: `${index}`,
    parentId: `node-${(index + 1) % 10_000}`,
  }));
  expect(issuesOf(input(nodes))).toEqual([
    { path: ["resources", 0, "parentId"], message: expect.stringMatching(/cycle/i) },
  ]);
});

describe("hierarchy validation", () => {
  it.each([
    ["self-parent", [{ id: "a", title: "A", parentId: "a" }], ["resources", 0, "parentId"]],
    [
      "missing parent",
      [{ id: "a", title: "A", parentId: "missing" }],
      ["resources", 0, "parentId"],
    ],
    ["empty parent", [{ id: "a", title: "A", parentId: "" }], ["resources", 0, "parentId"]],
    ["unknown kind", [{ id: "a", title: "A", kind: "building" }], ["resources", 0, "kind"]],
    [
      "duplicate node kinds",
      [
        { id: "a", title: "A", kind: "group" },
        { id: "a", title: "Again" },
      ],
      ["resources", 1, "id"],
    ],
    [
      "group beneath resource",
      [
        { id: "room", title: "Room" },
        { id: "floor", title: "Floor", kind: "group", parentId: "room" },
      ],
      ["resources", 1, "parentId"],
    ],
    [
      "disconnected cycle",
      [
        { id: "root", title: "Root" },
        { id: "a", title: "A", parentId: "b" },
        { id: "b", title: "B", parentId: "a" },
      ],
      ["resources", 1, "parentId"],
    ],
  ])("rejects %s with a useful input path", (_, nodes, path) => {
    expect(issuesOf({ ...input(), resources: nodes }).map((issue) => issue.path)).toEqual([path]);
  });

  it.each(["2026-09-01"])(
    "rejects events assigned to known groups even outside the range (%s)",
    (date) => {
      expect(
        issuesOf({
          ...input(),
          events: [
            {
              id: "invalid",
              title: "Invalid",
              resourceIds: ["floor"],
              start: `${date}T09:00Z`,
              end: `${date}T10:00Z`,
            },
          ],
        }),
      ).toEqual([
        {
          path: ["events", 0, "resourceIds", 0],
          message: expect.stringMatching(/group.*cannot own events/i),
        },
      ]);
    },
  );
});

describe("expansionToggleOf", () => {
  const rows = timelineOf(input()).rows;

  it("asks to collapse an open parent and to expand a collapsed one", () => {
    expect(expansionToggleOf(rows, new Set(), "floor")).toEqual({ id: "floor", expanded: false });
    expect(expansionToggleOf(rows, new Set(["floor"]), "floor")).toEqual({
      id: "floor",
      expanded: true,
    });
  });

  it("asks nothing for a row without children or a node that is not shown", () => {
    expect(expansionToggleOf(rows, new Set(), "bed")).toBeUndefined();
    expect(expansionToggleOf(rows, new Set(), "missing")).toBeUndefined();
  });
});
