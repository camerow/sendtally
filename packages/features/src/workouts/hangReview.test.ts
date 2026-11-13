import { describe, expect, it } from "vitest";
import type { HangWorkout } from "@sendtally/core/hang";
import { hangReview, hangReviewDraft, hangSessionOf } from "./hangReview";
import type { DoneParams } from "./runParams";
import type { PlannedRun } from "./usePlannedRun";

const repeaters: HangWorkout = {
  id: "w1",
  source: "library",
  grip: "half",
  timeUnits: { hangS: "s", restS: "s", setRestS: "s" },
  name: "Repeaters",
  kind: "hang",
  hangS: 7,
  restS: 3,
  reps: 2,
  sets: 2,
  setRestS: 60,
};
const planned: PlannedRun = { items: [{ workout: repeaters, dose: undefined }], exerciseRestS: 0 };
const model = {
  setup: () => ({ edgeMm: 20, loadKg: 5 }),
  gripName: (id: string) => (id === "open" ? "Open hand" : id),
};
const link = { membershipId: null, week: null, focus: null };
const startedAt = new Date(2026, 9, 22, 18, 5).getTime();
const timed: DoneParams = {
  workoutId: "w1",
  gripId: "open",
  link,
  session: 0,
  run: {
    done: [
      {
        item: 0,
        exercise: "open",
        sets: [
          { reps: 2, onS: 7, offS: 3 },
          { reps: 1, onS: 7 },
        ],
      },
    ],
    off: ["0:1"],
    setups: [{ edgeMm: 18, loadKg: 10 }],
    startedAt,
  },
};

describe("hangReview", () => {
  it("opens on what the timer ran, at its setup, its start and its length", () => {
    const review = hangReview(timed, planned, model);
    expect(review.setups).toEqual([{ edgeMm: 18, loadKg: 10 }]);
    const draft = hangReviewDraft(
      review,
      review.setups[0]!,
      model,
      "2026-10-30",
      startedAt + 25 * 60_000
    );
    expect(draft).toMatchObject({
      date: "2026-10-22",
      startTime: "18:05",
      minutes: 25,
      off: ["0:1"],
    });
    expect(draft.done[0]).toMatchObject({
      exercise: "Open hand",
      sets: [{ reps: 2 }, { reps: 1 }],
    });
  });

  it("opens every set as planned, today, when logged without the timer", () => {
    const review = hangReview({ ...timed, run: null }, planned, model);
    expect(review.setups).toEqual([{ edgeMm: 20, loadKg: 5 }]);
    const draft = hangReviewDraft(review, review.setups[0]!, model, "2026-10-30", startedAt);
    expect(draft).toMatchObject({ date: "2026-10-30", startTime: "", minutes: 0, off: [] });
    expect(draft.done[0]?.sets).toHaveLength(2);
  });

  it("saves the kept sets on the pill's setup", () => {
    const review = hangReview(timed, planned, model);
    const setup = { edgeMm: 18, loadKg: 10 };
    const draft = hangReviewDraft(review, setup, model, "2026-10-30", startedAt);
    const session = hangSessionOf(review, setup, draft, "s1");
    expect(session).toMatchObject({
      id: "s1",
      workoutId: "w1",
      gripId: "open",
      edgeMm: 18,
      loadKg: 10,
    });
    expect(session.done[0]?.sets).toHaveLength(1);
  });
});
