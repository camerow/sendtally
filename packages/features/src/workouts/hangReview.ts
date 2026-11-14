import {
  doneAsPrescribed,
  protocolDose,
  protocolOf,
  type CalendarDate,
  type HangSession,
  type HangSetup,
  type SessionItem,
} from "@sendtally/core/hang";
import { keptSets } from "../activities/done";
import type { ActivityDraft } from "../activities/draft";
import { startTimeOf } from "../activities/intervalsText";
import { hangResult } from "../hang/hangResult";
import type { HangModel } from "../hang/model";
import { today as dayOf } from "../journal/transforms";
import type { DoneParams } from "./runParams";
import type { PlannedRun } from "./usePlannedRun";

/** A hangboard workout's review: each item's grip, what was prescribed, and the setups it ran on. */
export type HangReview = {
  params: DoneParams;
  planned: PlannedRun;
  grips: string[];
  prescribed: SessionItem[];
  setups: HangSetup[];
};

/** What the timer ran, or every set as planned when the workout is logged without it. */
export function hangReview(
  params: DoneParams,
  planned: PlannedRun,
  model: Pick<HangModel, "setup">
): HangReview {
  const { items } = planned;
  const grips = items.map((i, k) => (k === 0 ? params.gripId : i.workout.grip));
  return {
    params,
    planned,
    grips,
    prescribed: items.map((i, k) => ({
      exercise: grips[k] ?? i.workout.grip,
      dose: protocolDose(i.workout),
    })),
    setups:
      params.run?.setups ?? items.map((i, k) => model.setup(i.workout, grips[k] ?? "", i.dose)),
  };
}

/**
 * The review's form as it opens, at `setup` for the first grip. A first-grip set at that load
 * follows the pill; one the timer ran heavier or lighter keeps its own. Its clock time is read
 * on the review only: a hang session saves none.
 */
export function hangReviewDraft(
  { params, planned, grips, prescribed, setups }: HangReview,
  setup: HangSetup,
  model: Pick<HangModel, "gripName">,
  today: CalendarDate,
  now: number
): ActivityDraft {
  const { run } = params;
  const workout = planned.items[0].workout;
  return {
    kind: "other",
    title: workout.name,
    date: run === null ? today : dayOf(new Date(run.startedAt)),
    startTime: run === null ? "" : startTimeOf(run.startedAt),
    minutes: run === null ? 0 : Math.max(1, Math.round((now - run.startedAt) / 60_000)),
    rpe: null,
    notes: "",
    workoutId: workout.id,
    ...params.link,
    done: (run?.done ?? doneAsPrescribed(prescribed)).map((d) => ({
      ...d,
      exercise: model.gripName(grips[d.item] ?? d.exercise),
      sets: d.sets.map(({ weightKg, ...s }) =>
        d.item === 0 && (weightKg === undefined || weightKg === setup.loadKg)
          ? s
          : { ...s, weightKg: weightKg ?? (setups[d.item] ?? setup).loadKg }
      ),
    })),
    off: run?.off ?? [],
  };
}

/** The hang session the reviewed `draft` saves as. */
export function hangSessionOf(
  { params, planned, grips, prescribed, setups }: HangReview,
  setup: HangSetup,
  draft: ActivityDraft,
  id: string
): HangSession {
  const { items } = planned;
  const workout = items[0].workout;
  const result = hangResult(keptSets(draft.done, draft.off), prescribed, (d) => ({
    exercise: grips[d.item] ?? d.exercise,
    setup: d.item === 0 ? setup : (setups[d.item] ?? setup),
    hang: items[d.item]?.workout.kind === "hang",
  }));
  return {
    id,
    workoutId: workout.id,
    gripId: params.gripId,
    date: draft.date,
    ...setup,
    pct: result.pct,
    misses: result.misses,
    rpe: draft.rpe,
    protocol: protocolOf(workout),
    membershipId: draft.membershipId,
    week: draft.week,
    focus: draft.focus,
    done: result.done,
  };
}
