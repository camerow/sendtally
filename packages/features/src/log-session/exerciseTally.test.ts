import { describe, expect, it } from "vitest";
import {
  exerciseLine,
  exerciseSets,
  nextSet,
  setGroups,
  setOver,
  startExercise,
  wallLeft,
  withExerciseClimb,
  withExerciseDone,
  withSetEnded,
  withWallStarted,
  type ExerciseTallyStart,
} from "./exerciseTally";
import { newTallyClimb, type TallyGo } from "./tally";
import type { LogSessionDraft } from "./types";

const NOW = new Date(2026, 9, 28, 18, 0);

const fourByFours: ExerciseTallyStart = {
  item: 0,
  name: "4x4s",
  sets: 4,
  climbs: 4,
  restS: 240,
};

const arc: ExerciseTallyStart = { item: 1, name: "ARC", sets: 2, onS: 1200, restS: 300 };

const at = (seconds: number): Date => new Date(NOW.getTime() + seconds * 1000);

/** A go on a fresh climb of the grade, as the tally logs it in exercise mode. */
function climb(draft: LogSessionDraft, grade: string, go: TallyGo = "sent"): LogSessionDraft {
  const next = newTallyClimb(draft, { kind: "grade", scale: "v", grade }, go);
  return withExerciseClimb(next.draft, next.key);
}

describe("exercise tally", () => {
  it("ends a set on its last climb, rests, and runs out of sets", () => {
    let draft = startExercise(null, fourByFours, NOW);
    expect(exerciseLine(draft, false)).toBe("4x4s · Set 1 of 4 · 0 of 4 climbs");
    draft = climb(climb(climb(draft, "V4"), "V3", "fell"), "V3");
    expect(setOver(draft, NOW)).toBe(false);
    expect(exerciseLine(draft, false)).toBe("4x4s · Set 1 of 4 · 3 of 4 climbs");
    draft = climb(draft, "V4");
    expect(setOver(draft, NOW)).toBe(true);

    const ended = withSetEnded(draft, NOW);
    expect(ended.restS).toBe(240);
    expect(exerciseLine(ended.draft, true)).toBe("4x4s · Set 2 of 4 next");
    expect(ended.draft.climbs.map((c) => c.set)).toEqual([1, 1, 1, 1]);

    const last = withSetEnded({ ...ended.draft, exercise: { ...fourByFours, set: 4 } }, NOW);
    expect(last.restS).toBe(0);
    expect(exerciseLine(last.draft, false)).toBe("4x4s · All sets done");
    expect(setOver(last.draft, NOW)).toBe(false);
  });

  it("keeps the climbs on Done and resumes at the set after the last one climbed", () => {
    let draft = climb(startExercise(null, fourByFours, NOW), "V4");
    draft = withExerciseDone(draft, NOW);
    expect(draft.exercise).toBeUndefined();
    expect(nextSet(draft.climbs, 0)).toBe(2);

    const resumed = startExercise(draft, fourByFours, at(600));
    expect(resumed.exercise?.set).toBe(2);
    expect(resumed.startedAt).toBe(at(600).toISOString());
    expect(climb(resumed, "V5").climbs.map((c) => [c.item, c.set])).toEqual([
      [0, 1],
      [0, 2],
    ]);
  });

  it("counts a time set down from its first grade and ends it at zero", () => {
    let draft = startExercise(null, arc, NOW);
    expect(wallLeft(draft.exercise!, at(60))).toBe(1200);
    expect(setOver(draft, at(5000))).toBe(false);

    draft = withWallStarted(draft, NOW);
    expect(withWallStarted(draft, at(30))).toBe(draft);
    expect(wallLeft(draft.exercise!, at(348))).toBe(852);
    draft = climb(climb(draft, "V1"), "V1");
    expect(exerciseLine(draft, false)).toBe("ARC · Set 1 of 2 · 2 laps");
    expect(setOver(draft, at(1199))).toBe(false);
    expect(setOver(draft, at(1200))).toBe(true);

    const ended = withSetEnded(draft, NOW);
    expect(ended.restS).toBe(300);
    expect(ended.draft.exercise).toMatchObject({ set: 2 });
    expect(ended.draft.exercise?.setStartedAt).toBeUndefined();
  });

  it("runs a set with no climb count until Done", () => {
    const limit = { item: 2, name: "Limit bouldering", sets: 1, restS: 0 };
    let draft = startExercise(null, limit, NOW);
    for (const grade of ["V6", "V7", "V6", "V7", "V6"]) draft = climb(draft, grade, "fell");
    expect(setOver(draft, at(3600))).toBe(false);
    expect(exerciseLine(draft, false)).toBe("Limit bouldering · Set 1 of 1 · 5 climbs");
  });

  it("groups the exercise's climbs by set, the current set first and each newest first", () => {
    let draft = startExercise(null, fourByFours, NOW);
    for (const grade of ["V4", "V3", "V4", "V2"]) draft = climb(draft, grade);
    draft = climb(withSetEnded(draft, NOW).draft, "V4");
    draft = climb(draft, "V3");
    const groups = setGroups(draft);
    expect(groups.map((g) => g.label)).toEqual(["Set 2", "Set 1 · 4 of 4 climbs"]);
    expect(groups[0]?.climbs.map((c) => c.grade)).toEqual(["V3", "V4"]);
    expect(groups[1]?.climbs.map((c) => c.grade)).toEqual(["V2", "V4", "V3", "V4"]);
  });

  it("hands each item's climbs back as the sets they went in", () => {
    let draft = startExercise(null, arc, NOW);
    draft = climb(draft, "V1", "fell");
    draft = climb(withSetEnded(draft, NOW).draft, "V2");
    draft = climb(startExercise(withExerciseDone(draft, NOW), fourByFours, at(2000)), "V4");
    expect(exerciseSets(draft, 1, undefined, NOW)).toEqual([
      { climbs: [{ grade: "V1", scale: "v", tries: 1, sent: false }] },
      { climbs: [{ grade: "V2", scale: "v", tries: 1, sent: true, style: "flash" }] },
    ]);
    expect(exerciseSets(draft, 0, undefined, NOW)).toEqual([
      { climbs: [{ grade: "V4", scale: "v", tries: 1, sent: true, style: "flash" }] },
    ]);
    expect(exerciseSets(draft, 5, undefined, NOW)).toEqual([]);
  });

  it("logs each time set with the time spent on the wall, not the time planned", () => {
    let draft = climb(withWallStarted(startExercise(null, arc, NOW), NOW), "V1");
    draft = withSetEnded(draft, at(1200)).draft;
    draft = climb(withWallStarted(draft, at(1500)), "V2");
    draft = withExerciseDone(draft, at(1520));
    expect(exerciseSets(draft, 1, 600, at(1600)).map((s) => s.onS)).toEqual([1200, 20]);
  });

  it("logs a set still on the wall when the run finishes with its time so far", () => {
    const draft = climb(withWallStarted(startExercise(null, arc, NOW), NOW), "V1");
    expect(exerciseSets(draft, 1, 1200, at(23)).map((s) => s.onS)).toEqual([23]);
  });

  it("keeps a running set's time on the wall when another exercise starts", () => {
    let draft = climb(withWallStarted(startExercise(null, arc, NOW), NOW), "V1");
    draft = climb(startExercise(draft, fourByFours, at(30)), "V4");
    expect(exerciseSets(draft, 1, 1200, at(90)).map((s) => s.onS)).toEqual([30]);
  });

  it("never logs a negative time on the wall when the clock has moved back past the set's start", () => {
    const draft = climb(withWallStarted(startExercise(null, arc, NOW), at(300)), "V1");
    expect(wallLeft(draft.exercise!, NOW)).toBe(1200);
    expect(exerciseSets(withExerciseDone(draft, NOW), 1, 600, NOW).map((s) => s.onS)).toEqual([0]);
  });

  it("logs the planned time for a set with no time on the wall kept, as a draft from before did", () => {
    const draft = climb(startExercise(null, arc, NOW), "V1");
    expect(exerciseSets(draft, 1, 1200, at(60)).map((s) => s.onS)).toEqual([1200]);
  });
});
