import { describe, expect, it } from "vitest";
import { hangEditResult, hangEditSets } from "./hangEdit";

const sets = (edgeMm: number): { reps: number; onS: number; edgeMm: number; weightKg: number }[] =>
  Array.from({ length: 2 }, () => ({ reps: 5, onS: 10, edgeMm, weightKg: 0 }));

const session = {
  gripId: "half",
  loadKg: 0,
  pct: 100,
  protocol: {
    name: "Max",
    kind: "hang" as const,
    hangS: 10,
    restS: 0,
    reps: 5,
    sets: 2,
    setRestS: 0,
  },
  done: [
    { item: 0, exercise: "half", sets: sets(20) },
    { item: 1, exercise: "open", sets: sets(18) },
    { item: 2, exercise: "pinch", sets: sets(0) },
  ],
};

describe("hangEditResult", () => {
  it("saves an untouched edit as it was", () => {
    const result = hangEditResult(session, hangEditSets(session), "half", {
      edgeMm: 20,
      loadKg: 0,
    });
    expect(result).toEqual({ done: session.done, pct: 100, misses: 0 });
  });

  it("keeps a grip it was never given rather than dropping it", () => {
    const [first] = hangEditSets(session).done;
    const result = hangEditResult(
      session,
      { done: first === undefined ? [] : [first], off: [] },
      "half",
      {
        edgeMm: 20,
        loadKg: 0,
      }
    );
    expect(result.done.map((d) => d.exercise)).toEqual(["half", "open", "pinch"]);
  });

  it("drops a grip whose every set the person removed", () => {
    const result = hangEditResult(
      session,
      { ...hangEditSets(session), off: ["1:0", "1:1"] },
      "half",
      { edgeMm: 20, loadKg: 0 }
    );
    expect(result.done.map((d) => d.exercise)).toEqual(["half", "pinch"]);
  });
});
