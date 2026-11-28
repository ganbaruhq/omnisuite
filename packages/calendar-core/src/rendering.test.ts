import { Result } from "effect";
import { describe, expect, it } from "vite-plus/test";
import {
  decodeTimelineResult,
  disclosureDescriptionOf,
  disclosureLabelOf,
  laneLabelOf,
  placementBoxOf,
  slotBoxOf,
  type Timeline,
  type TimelineResourceRow,
} from "./index.js";

const timeline = (() => {
  const result = decodeTimelineResult({
    range: { start: "2026-10-26T00:00Z", end: "2026-10-27T00:00Z" },
    slotDuration: "PT6H",
    resources: [
      { id: "floor", title: "First floor", kind: "group" },
      { id: "room", title: "Room 101", parentId: "floor" },
    ],
    events: [
      {
        id: "stay",
        title: "Stay",
        resourceIds: ["room"],
        start: "2026-10-26T06:00Z",
        end: "2026-10-26T12:00Z",
      },
      {
        id: "clean",
        title: "Clean",
        resourceIds: ["room"],
        start: "2026-10-26T09:00Z",
        end: "2026-10-26T15:00Z",
      },
    ],
  });
  if (!Result.isSuccess(result)) throw new Error("the fixture must decode");
  return result.success as Timeline;
})();
const room = timeline.rows.find((row) => row.kind === "resource") as TimelineResourceRow;
const group = timeline.rows.find((row) => row.kind === "group")!;

describe("slotBoxOf", () => {
  it("places a slot over its share of the range, in percent", () => {
    expect(slotBoxOf(timeline, timeline.slots[1]!)).toEqual({ inlineStart: 25, inlineSize: 25 });
  });
});

describe("placementBoxOf", () => {
  it("places an occurrence over its share of the range and in its own lane", () => {
    const [stay, clean] = room.placements;
    expect(room.laneCount).toBe(2);
    expect(placementBoxOf(timeline, room.laneCount, stay!)).toEqual({
      inlineStart: 25,
      inlineSize: 25,
      blockStart: 0,
      blockEnd: 50,
    });
    expect(placementBoxOf(timeline, room.laneCount, clean!)).toEqual({
      inlineStart: 37.5,
      inlineSize: 25,
      blockStart: 50,
      blockEnd: 0,
    });
  });
});

describe("accessible names", () => {
  it("names a lane after its resource", () => {
    expect(laneLabelOf(room)).toBe("Room 101 events");
  });

  it("names a disclosure for what pressing it does, and describes the row's level", () => {
    expect(disclosureLabelOf(group, true)).toBe("Collapse First floor");
    expect(disclosureLabelOf(group, false)).toBe("Expand First floor");
    expect(disclosureDescriptionOf(group)).toBe("Group, level 1");
    expect(disclosureDescriptionOf(room)).toBe("Resource, level 2");
  });
});
