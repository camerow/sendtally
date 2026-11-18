import { describe, expect, it } from "vitest";
import type { HangRun } from "@sendtally/core/hang";
import { gripRuns, hangSets, hangTotals } from "../activities/summary";
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

const logged = (s: Pick<HangRun, "pct" | "done">): HangRun => ({
  ...session,
  ...s,
  id: "s1",
  workoutId: null,
  date: "2026-11-17",
  edgeMm: 20,
  misses: 0,
  rpe: null,
  membershipId: null,
  week: null,
  focus: null,
});

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

  it("keeps a grip edited down to no held sets, with its dose, so its percentage holds on the next edit", () => {
    const setup = { edgeMm: 20, loadKg: 0 };
    const edited = hangEditSets(session);
    const zeroed = edited.done.map((d) =>
      d.item === 1 ? { ...d, sets: d.sets.map((s) => ({ ...s, reps: 0 })) } : d
    );
    const result = hangEditResult(session, { done: zeroed, off: [] }, "half", setup);
    expect(result.pct).toBe(67);
    expect(result.done.map((d) => [d.exercise, d.sets.length])).toEqual([
      ["half", 2],
      ["open", 0],
      ["pinch", 2],
    ]);
    expect(result.done[1]?.dose).toMatchObject({
      sets: 2,
      reps: 5,
      onS: 10,
      edgeMm: 18,
      weightKg: 0,
    });
    const saved = { ...session, pct: result.pct, done: result.done };
    expect(gripRuns(logged(saved)).map((r) => r.gripId)).toEqual(["half", "pinch"]);
    const reopened = hangEditSets(saved);
    expect(reopened.done[1]?.sets).toEqual([
      { reps: 0, edgeMm: 18, weightKg: 0 },
      { reps: 0, edgeMm: 18, weightKg: 0 },
    ]);
    expect(hangEditResult(saved, reopened, "half", setup)).toMatchObject({
      pct: 67,
      done: result.done,
    });
  });

  it("leaves a first grip that held nothing out of its history and totals, its percentage whole", () => {
    const setup = { edgeMm: 20, loadKg: 0 };
    const zeroed = hangEditSets(session).done.map((d) =>
      d.item === 0 ? { ...d, sets: d.sets.map((s) => ({ ...s, reps: 0 })) } : d
    );
    const result = hangEditResult(session, { done: zeroed, off: [] }, "half", setup);
    expect(result.pct).toBe(67);
    const saved = { ...session, pct: result.pct, done: result.done };
    expect(gripRuns(logged(saved)).map((r) => r.gripId)).toEqual(["open", "pinch"]);
    expect(hangTotals(logged(saved))).toMatchObject({ held: 20, total: 20 });
    // Builds before this one read a first grip's saved sets when it has any: one set of no hangs reads as none held.
    expect(hangSets(saved)).toHaveLength(1);
    expect(hangSets(saved)[0]?.reps).toBe(0);
    const reopened = hangEditSets(saved);
    expect(reopened.done[0]?.sets).toHaveLength(2);
    expect(hangEditResult(saved, reopened, "half", setup).pct).toBe(67);
  });

  it("reads a later grip against the dose it ran, so a set left out of the run stays unheld", () => {
    const ran = {
      ...session,
      done: session.done.map((d) =>
        d.item === 1 ? { ...d, dose: { sets: 3, reps: 6, onS: 10 } } : d
      ),
    };
    const result = hangEditResult(ran, hangEditSets(ran), "half", { edgeMm: 20, loadKg: 0 });
    expect(result).toMatchObject({ pct: 79, misses: 2 });
    expect(result.done[1]?.dose).toEqual({ sets: 3, reps: 6, onS: 10 });
  });
});
