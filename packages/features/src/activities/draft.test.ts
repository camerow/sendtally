import { describe, expect, it } from "vitest";
import { activityFromDraft, draftFromActivity, newActivityDraft, minutesOf } from "./draft";

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

  it("leaves out the sets a player did not finish", () => {
    const done = [
      { item: 0, exercise: "Cat-cow", sets: [{}] },
      { item: 1, exercise: "Pigeon", sets: [{ onS: 60 }] },
    ];
    const draft = newActivityDraft({ done: JSON.stringify(done), off: '["1:0"]' }, "2026-10-22");
    expect(draft.off).toEqual(["1:0"]);
    expect(activityFromDraft("a1", draft).done).toEqual([done[0]]);
    expect(newActivityDraft({ off: "[" }, "2026-10-22").off).toEqual([]);
  });

  it("keeps a length typed in seconds as whole minutes, one to a day", () => {
    expect(minutesOf(45 * 60)).toBe(45);
    expect(minutesOf(90)).toBe(2);
    expect(minutesOf(0)).toBe(1);
    expect(minutesOf(86399)).toBe(1440);
  });

  it("reads a prefilled length, falling back to an hour", () => {
    expect(newActivityDraft({ minutes: "45" }, "2026-10-22").minutes).toBe(45);
    expect(newActivityDraft({ minutes: "2000" }, "2026-10-22").minutes).toBe(1440);
    expect(newActivityDraft({ minutes: "abc" }, "2026-10-22").minutes).toBe(60);
    expect(newActivityDraft({ minutes: "" }, "2026-10-22").minutes).toBe(60);
  });
});
