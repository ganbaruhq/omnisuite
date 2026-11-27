import { describe, expect, it } from "vite-plus/test";
import { editGestureLogic, type GesturePreview } from "./index.js";

const start = {
  input: "pointer" as const,
  operation: "move" as const,
  eventId: "emma",
  sourceResourceId: "room-101",
  fingerprint: "emma@09:10",
};
const value = {
  id: "emma",
  resourceIds: ["room-101"],
  title: "Emma",
  start: "2026-10-26T09:10:00Z",
  end: "2026-10-26T10:20:00Z",
};
const preview: GesturePreview = {
  targetResourceId: "room-102",
  evaluation: {
    status: "unchanged",
    proposal: {
      operation: "move",
      eventId: "emma",
      occurrenceId: JSON.stringify(["emma", "room-101"]),
      sourceResourceId: "room-101",
      targetResourceId: "room-101",
      before: value,
      after: value,
    },
  },
};

describe("editGestureLogic", () => {
  it("starts idle, with nothing cancelled", () => {
    const store = editGestureLogic.createStore();
    expect(store.getSnapshot().context).toEqual({ gesture: undefined, cancellation: undefined });
  });

  it("tracks the active gesture, its keyboard position and its destination preview", () => {
    const store = editGestureLogic.createStore();
    store.trigger.gestureStarted(start);
    expect(store.getSnapshot().context.gesture).toMatchObject({
      input: "pointer",
      operation: "move",
      edge: undefined,
      eventId: "emma",
      sourceResourceId: "room-101",
      occurrenceId: JSON.stringify(["emma", "room-101"]),
      fingerprint: "emma@09:10",
      steps: 0,
      targetResourceId: "room-101",
      preview: undefined,
    });

    store.trigger.stepped({ by: 2 });
    store.trigger.stepped({ by: -3 });
    store.trigger.retargeted({ resourceId: "room-102" });
    store.trigger.previewChanged({ preview });
    expect(store.getSnapshot().context.gesture).toMatchObject({
      steps: -1,
      targetResourceId: "room-102",
      preview,
    });

    store.trigger.previewChanged({ preview: undefined });
    expect(store.getSnapshot().context.gesture?.preview).toBeUndefined();
  });

  it("knows which edge a resize drags", () => {
    const store = editGestureLogic.createStore();
    store.trigger.gestureStarted({ ...start, operation: "resize", edge: "start" });
    expect(store.getSnapshot().context.gesture).toMatchObject({
      operation: "resize",
      edge: "start",
      targetResourceId: "room-101",
    });
    store.trigger.gestureCanceled({ reason: "escape" });
    expect(store.getSnapshot().context.cancellation).toEqual({
      eventId: "emma",
      operation: "resize",
      reason: "escape",
    });
  });

  it("ends a gesture without recording a cancellation", () => {
    const store = editGestureLogic.createStore();
    store.trigger.gestureStarted(start);
    store.trigger.gestureEnded();
    expect(store.getSnapshot().context).toEqual({ gesture: undefined, cancellation: undefined });
  });

  it("records why a gesture was cancelled until the next one begins", () => {
    const store = editGestureLogic.createStore();
    store.trigger.gestureStarted(start);
    store.trigger.gestureCanceled({ reason: "escape" });
    expect(store.getSnapshot().context).toEqual({
      gesture: undefined,
      cancellation: { eventId: "emma", operation: "move", reason: "escape" },
    });

    store.trigger.gestureStarted({ ...start, eventId: "noah" });
    expect(store.getSnapshot().context.cancellation).toBeUndefined();
  });

  it("ignores changes when no gesture is active", () => {
    const store = editGestureLogic.createStore();
    const idle = store.getSnapshot().context;
    store.trigger.stepped({ by: 1 });
    store.trigger.retargeted({ resourceId: "room-102" });
    store.trigger.previewChanged({ preview });
    store.trigger.gestureCanceled({ reason: "escape" });
    store.trigger.gestureEnded();
    expect(store.getSnapshot().context).toEqual(idle);
  });

  it("keeps the gesture it has when another begins", () => {
    const store = editGestureLogic.createStore();
    store.trigger.gestureStarted(start);
    store.trigger.gestureStarted({ ...start, eventId: "noah" });
    expect(store.getSnapshot().context.gesture?.eventId).toBe("emma");
  });

  it("gives each store its own state", () => {
    const first = editGestureLogic.createStore();
    const second = editGestureLogic.createStore();
    first.trigger.gestureStarted(start);
    expect(second.getSnapshot().context.gesture).toBeUndefined();
  });
});
