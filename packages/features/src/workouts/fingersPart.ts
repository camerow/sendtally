import {
  hangSessionItems,
  protocolDose,
  type HangKind,
  type HangPhase,
  type HangSetup,
  type ItemDone,
  type Run,
  type SessionItem,
  type SetDone,
} from "@sendtally/core/hang";
import type { Activity, HangPart } from "@sendtally/api-client";
import { hangEditResult, hangEditSets } from "../hang/hangEdit";
import { hangWorkoutFromItem, type HangModel } from "../hang/model";
import { t } from "../i18n";
import { NO_PLAN } from "../training/planLinkParams";
import type { LiveRun } from "./liveRun";
import { hangReview, hangReviewDraft, hangSessionOf } from "./hangReview";
import type { TimerRun, WorkoutRun } from "./runParams";
import type { PlannedRun } from "./usePlannedRun";

/**
 * A mix's fingerboard part in its live run: the timer's run while the timer has it, then the
 * sets it held as editable rows (each grip by its id, a set never reached at no hangs), with
 * each grip's setup, the first the one its pill sets.
 */
export type FingersPart = { run: Run<HangPhase>; setups: HangSetup[] } | PartRows;

/** The part's rows once its timer ends, and what it ran, which its save reads. */
export type PartRows = { done: ItemDone[]; setups: HangSetup[]; planned: PlannedRun };

/** What an activity save carries for its run's fingerboard part. */
export type Fingerboard = NonNullable<Activity["fingerboard"]>;

/** Where a run's grips sit in its items, in order: one block, its fingerboard part. */
export const partPlaces = (
  items: readonly SessionItem[],
  isGrip: (exercise: string) => boolean
): number[] => items.flatMap((i, k) => (isGrip(i.exercise) ? [k] : []));

type PartOf = Pick<WorkoutRun, "workoutId" | "title" | "items" | "exerciseRestS">;

/** The part as the hang timer runs it: its grips in order, each on its own dose; none without grips. */
export function partPlanned(run: PartOf, places: readonly number[]): PlannedRun | null {
  const [first, ...rest] = places.flatMap((k) => {
    const item = run.items[k];
    return item === undefined
      ? []
      : [
          {
            workout: hangWorkoutFromItem(
              { id: run.workoutId, source: "mine", name: run.title },
              item
            ),
            dose: item.dose,
            restAfterS: item.restAfterS,
          },
        ];
  });
  return first === undefined ? null : { items: [first, ...rest], exerciseRestS: run.exerciseRestS };
}

const reviewOf = (planned: PlannedRun, run: TimerRun, model: Pick<HangModel, "setup">) =>
  hangReview(
    { workoutId: "", gripId: planned.items[0].workout.grip, link: NO_PLAN, session: 0, run },
    planned,
    model
  );

/** The part's rows once its timer ends, as the hang review opens them, each grip by its id. */
export function partRows(
  planned: PlannedRun,
  run: TimerRun,
  model: Pick<HangModel, "setup" | "gripName">
): ItemDone[] {
  const review = reviewOf(planned, run, model);
  const [setup] = run.setups;
  if (setup === undefined) return [];
  return hangReviewDraft(review, setup, model, "", run.startedAt).done.map((d) => ({
    ...d,
    exercise: review.grips[d.item] ?? d.exercise,
  }));
}

/** What the part saves with its run: the sets it held, as the hang review saves a session. */
export function partBody(part: PartRows): Fingerboard | null {
  const { planned } = part;
  const [setup] = part.setups;
  if (setup === undefined) return null;
  // Every grip's setup is the part's own, so the model's last-used setups are never asked.
  const review = reviewOf(
    planned,
    { done: [], off: [], setups: part.setups, startedAt: 0 },
    { setup: () => setup }
  );
  const s = hangSessionOf(
    review,
    setup,
    { date: "", rpe: null, membershipId: null, week: null, focus: null, done: part.done, off: [] },
    ""
  );
  if (s.done.length === 0) return null;
  const { gripId, edgeMm, loadKg, pct, misses, protocol, done } = s;
  return { gripId, edgeMm, loadKg, pct, misses, protocol, done };
}

/** Hangs the part held so far: the timer's hangs done while it runs, else its rows' hangs. */
export const partHangs = (part: FingersPart | undefined): number =>
  part === undefined
    ? 0
    : "run" in part
      ? part.run.done.length
      : part.done.reduce((n, d) => n + d.sets.reduce((m, s) => m + Math.max(0, s.reps ?? 1), 0), 0);

/** What discarding a live run loses: nothing logged, and its fingerboard part's hangs when it held any. */
export function discardRunBody(run: Pick<LiveRun, "state"> | null): string {
  const hangs = run?.state.player === "sets" ? partHangs(run.state.fingers) : 0;
  return hangs > 0 ? t("workouts.discardPartBody", { n: hangs }) : t("hang.discardRunBody");
}

/** A fingerboard part as a review or edit holds it, and what it saves as. */
export type PartForm = {
  /** Each grip's sets, by grip id. */
  done: ItemDone[];
  /** The first grip's edge and load, on its pill. */
  setup: HangSetup;
  kind: HangKind;
  /** Each grip's dose, which a set short of it reads against. */
  planned: (SetDone | undefined)[];
  body: (done: ItemDone[], setup: HangSetup) => Fingerboard | null;
};

/** The part a live run's timer ended with, for the review after Finish. */
export function livePartForm(part: PartRows): PartForm {
  const { planned, setups } = part;
  return {
    done: part.done,
    setup: setups[0] ?? { edgeMm: 0, loadKg: 0 },
    kind: planned.items[0].workout.kind,
    planned: planned.items.map((i) => i.dose ?? protocolDose(i.workout)),
    body: (done, setup) => partBody({ done, setups: [setup, ...setups.slice(1)], planned }),
  };
}

/** A logged run's part, for its edit: every grip it ran, each keeping its own dose and load. */
export function loggedPartForm(part: HangPart): PartForm {
  return {
    done: hangEditSets(part).done,
    setup: { edgeMm: part.edgeMm, loadKg: part.loadKg },
    kind: part.protocol.kind,
    planned: hangSessionItems(part).map((i) => i.dose),
    body: (done, setup) => {
      const {
        pct,
        misses,
        done: saved,
      } = hangEditResult(part, { done, off: [] }, part.gripId, setup);
      if (saved.length === 0) return null;
      return { gripId: part.gripId, ...setup, pct, misses, protocol: part.protocol, done: saved };
    },
  };
}
