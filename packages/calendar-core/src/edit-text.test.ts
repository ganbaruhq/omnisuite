import { Result } from "effect";
import { describe, expect, it } from "vite-plus/test";
import {
  cancelMessageOf,
  decodeEditingResult,
  decodeTimelineResult,
  describePreviewInEnglish,
  editCapabilityOf,
  editFingerprintOf,
  evaluateMove,
  evaluateResize,
  evaluationKeyOf,
  previewDescriptionOf,
  resizableEdgesOf,
  unchangedMessageOf,
  untargetedMessageOf,
  type EditEvaluation,
  type EventProposal,
} from "./index.js";

const timeline = (() => {
  const result = decodeTimelineResult({
    range: { start: "2026-10-26T00:00Z", end: "2026-10-27T00:00Z" },
    slotDuration: "PT1H",
    resources: [
      { id: "room-101", title: "Room 101" },
      { id: "room-102", title: "Room 102" },
    ],
    events: [
      {
        id: "emma",
        title: "Emma",
        resourceIds: ["room-101"],
        start: "2026-10-26T09:00Z",
        end: "2026-10-26T10:00Z",
      },
    ],
  });
  if (Result.isFailure(result)) throw new Error(result.failure.message);
  return result.success;
})();

const editing = (() => {
  const result = decodeEditingResult({
    snap: "PT30M",
    startEditable: true,
    resourceEditable: true,
    durationEditable: true,
  });
  if (Result.isFailure(result)) throw new Error(result.failure.message);
  return result.success;
})();

const proposalOf = (evaluation: EditEvaluation) => {
  if (evaluation.status === "unavailable") throw new Error("Expected a proposal");
  return evaluation.proposal;
};

const moved: EventProposal = proposalOf(
  evaluateMove(timeline, editing, {
    eventId: "emma",
    sourceResourceId: "room-101",
    targetResourceId: "room-102",
    shift: { steps: 2 },
  }),
);

describe("previewDescriptionOf", () => {
  it("names the event, the resources it lands on and the time zone", () => {
    expect(previewDescriptionOf(timeline, "allowed", moved)).toEqual({
      status: "allowed",
      proposal: moved,
      title: "Emma",
      resourceTitles: ["Room 102"],
      timeZone: "UTC",
    });
  });

  it("keeps the rule and its error for a rejection", () => {
    const error = new Error("boom");
    expect(
      previewDescriptionOf(timeline, "rejected", moved, { rule: "allow", error }),
    ).toMatchObject({ status: "rejected", rule: "allow", error });
  });

  it("falls back to the id for a resource outside the timeline, and to UTC", () => {
    const elsewhere = { ...moved, after: { ...moved.after, resourceIds: ["annex"] } };
    expect(previewDescriptionOf(undefined, "allowed", elsewhere)).toMatchObject({
      resourceTitles: ["annex"],
      timeZone: "UTC",
    });
  });
});

describe("describePreviewInEnglish", () => {
  it("describes a move, a resize, a stay and a rejection", () => {
    const describe = (...args: Parameters<typeof previewDescriptionOf>) =>
      describePreviewInEnglish(previewDescriptionOf(...args));
    expect(describe(timeline, "allowed", moved)).toBe(
      "Move Emma to Room 102, Oct 26, 2026, 10:00 AM to Oct 26, 2026, 11:00 AM",
    );
    const resized = proposalOf(
      evaluateResize(timeline, editing, {
        eventId: "emma",
        resourceId: "room-101",
        edge: "end",
        shift: { steps: 1 },
      }),
    );
    expect(describe(timeline, "allowed", resized)).toBe(
      "Resize the end of Emma on Room 101, Oct 26, 2026, 9:00 AM to Oct 26, 2026, 10:30 AM",
    );
    expect(describe(timeline, "unchanged", moved)).toBe(
      "Emma stays on Room 102, Oct 26, 2026, 10:00 AM to Oct 26, 2026, 11:00 AM",
    );
    expect(describe(timeline, "rejected", moved, { rule: "overlap" })).toBe(
      "Not allowed: Emma on Room 102, Oct 26, 2026, 10:00 AM to Oct 26, 2026, 11:00 AM (overlaps another event)",
    );
    expect(describe(timeline, "rejected", moved, { rule: "allow", error: 1 })).toMatch(
      /\(a rule failed\)$/,
    );
  });
});

describe("messages", () => {
  it("says how a gesture was cancelled", () => {
    expect(cancelMessageOf("move", "escape")).toBe("Move cancelled.");
    expect(cancelMessageOf("resize", "blur")).toBe("Resize cancelled.");
    expect(cancelMessageOf("move", "invalid-target")).toBe("Move cancelled: not over a resource.");
    expect(cancelMessageOf("move", "rejected")).toBe(
      "Move cancelled: that destination is not allowed.",
    );
    expect(cancelMessageOf("resize", "rejected")).toBe(
      "Resize cancelled: that interval is not allowed.",
    );
    expect(cancelMessageOf("move", "event-removed")).toBe("Move cancelled: the event was removed.");
    expect(cancelMessageOf("resize", "event-changed")).toBe("Resize cancelled: the event changed.");
  });

  it("says when nothing changed and when nothing is targeted", () => {
    expect(unchangedMessageOf("move", "Emma")).toBe("Emma was not moved.");
    expect(unchangedMessageOf("resize", "Emma")).toBe("Emma was not resized.");
    expect(untargetedMessageOf("move", "Emma")).toBe("Moving Emma: not over a resource.");
    expect(untargetedMessageOf("resize", "Emma")).toBe("Resizing Emma: not over a resource.");
  });
});

describe("editFingerprintOf", () => {
  it("changes with the event's values and not otherwise", () => {
    const event = timeline.events[0]!;
    expect(editFingerprintOf({ ...event })).toBe(editFingerprintOf(event));
    expect(editFingerprintOf({ ...event, title: "Emma B." })).not.toBe(editFingerprintOf(event));
    expect(editFingerprintOf({ ...event, startEditable: false })).not.toBe(
      editFingerprintOf(event),
    );
  });
});

describe("evaluationKeyOf", () => {
  it("is equal for the same result and differs for another", () => {
    const at = (steps: number) =>
      evaluateMove(timeline, editing, {
        eventId: "emma",
        sourceResourceId: "room-101",
        targetResourceId: "room-101",
        shift: { steps },
      });
    expect(evaluationKeyOf(undefined)).toBe("");
    expect(evaluationKeyOf(at(1))).toBe(evaluationKeyOf(at(1)));
    expect(evaluationKeyOf(at(1))).not.toBe(evaluationKeyOf(at(2)));
    expect(evaluationKeyOf({ status: "unavailable", reason: "read-only" })).toBe(
      "unavailable:read-only",
    );
  });
});

describe("editCapabilityOf", () => {
  const none = {
    startEditable: undefined,
    resourceEditable: undefined,
    durationEditable: undefined,
  };

  it("allows nothing without editing", () => {
    expect(editCapabilityOf({ ...none, startEditable: true }, undefined)).toEqual({
      time: false,
      resource: false,
      duration: false,
      move: false,
      edit: false,
    });
  });

  it("lets the event's own settings override the timeline's", () => {
    const resizeOnly = { ...editing, startEditable: false, resourceEditable: false };
    expect(editCapabilityOf(none, resizeOnly)).toEqual({
      time: false,
      resource: false,
      duration: true,
      move: false,
      edit: true,
    });
    expect(editCapabilityOf({ ...none, resourceEditable: true }, resizeOnly)).toMatchObject({
      resource: true,
      move: true,
    });
    expect(editCapabilityOf({ ...none, durationEditable: false }, resizeOnly).edit).toBe(false);
  });
});

describe("resizableEdgesOf", () => {
  it("offers only the endpoints the range does not clip", () => {
    expect(resizableEdgesOf({ startsBefore: false, endsAfter: false }, true)).toEqual({
      start: true,
      end: true,
    });
    expect(resizableEdgesOf({ startsBefore: true, endsAfter: false }, true)).toEqual({
      start: false,
      end: true,
    });
    expect(resizableEdgesOf({ startsBefore: false, endsAfter: false }, false)).toEqual({
      start: false,
      end: false,
    });
  });
});
