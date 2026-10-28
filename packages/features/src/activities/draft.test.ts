import { describe, expect, it } from "vitest";
import {
  activityFromDraft,
  draftFromActivity,
  newActivityDraft,
  parseMinutes,
  stepMinutes,
  trainingLoadLabel,
} from "./draft";

describe("activity drafts", () => {
  it("takes what the route knows and ignores a kind it does not", () => {
    expect(
      newActivityDraft(
        { kind: "other", membershipId: "m1", week: "2", workoutId: "w1" },
        "2026-10-22"
      )
    ).toMatchObject({
      kind: "other",
      date: "2026-10-22",
      membershipId: "m1",
      week: 2,
      workoutId: "w1",
    });
    expect(newActivityDraft({ week: "soon" }, "2026-10-22").week).toBeNull();
    expect(newActivityDraft({ kind: "climb" }, "2026-10-22").kind).toBe("strength");
    expect(newActivityDraft({ minutes: "45" }, "2026-10-22").minutes).toBe(45);
    expect(newActivityDraft({ minutes: "soon" }, "2026-10-22").minutes).toBe(60);
  });

  it("names an untitled activity after its kind and drops empty text", () => {
    const draft = { ...newActivityDraft({ kind: "mobility" }, "2026-10-22"), notes: "  " };
    const activity = activityFromDraft("a1", draft);
    expect(activity).toMatchObject({ id: "a1", title: "Mobility", startTime: null, notes: null });
    expect(draftFromActivity(activity)).toEqual({ ...draft, title: "Mobility", notes: "" });
  });

  it("starts as done what a player ran or else what the workout prescribes, and saves only named items", () => {
    const draft = newActivityDraft({ kind: "mobility" }, "2026-10-22", [
      { exercise: "Cat-cow", dose: { sets: 2, reps: 10 } },
    ]);
    expect(draft.done).toEqual([
      { item: 0, exercise: "Cat-cow", sets: [{ reps: 10 }, { reps: 10 }] },
    ]);
    const ran = [{ item: 0, exercise: "Cat-cow", sets: [{ reps: 8 }] }];
    const prescribed = [{ exercise: "Cat-cow", dose: { sets: 2, reps: 10 } }];
    expect(newActivityDraft({ done: JSON.stringify(ran) }, "2026-10-22", prescribed).done).toEqual(
      ran
    );
    expect(newActivityDraft({ done: "[{" }, "2026-10-22", prescribed).done).toHaveLength(1);
    expect(newActivityDraft({ done: "[1]" }, "2026-10-22", prescribed).done[0]?.sets).toHaveLength(
      2
    );
    const blank = { ...draft, done: [{ item: 0, exercise: " ", sets: [] }] };
    expect(activityFromDraft("a1", blank).done).toEqual([]);
  });

  it("steps minutes to the next multiple of five and keeps them in range", () => {
    expect(stepMinutes(52, 1)).toBe(55);
    expect(stepMinutes(52, -1)).toBe(50);
    expect(stepMinutes(5, -1)).toBe(1);
    expect(parseMinutes("45")).toBe(45);
    expect(parseMinutes("2000")).toBe(1440);
    expect(parseMinutes("abc")).toBeNull();
    expect(parseMinutes("")).toBeNull();
  });

  it("shows the load only once there is an effort", () => {
    expect(trainingLoadLabel({ minutes: 50, rpe: 7 })).toBe("50 min × 7 = 350");
    expect(trainingLoadLabel({ minutes: 50, rpe: null })).toBeNull();
  });
});
