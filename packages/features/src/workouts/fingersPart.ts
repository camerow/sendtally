import {
  currentPhase,
  heldSet,
  isWork,
  setsHeld,
  togglePause,
  hangSessionItems,
  type Dose,
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
import type { LiveRun, LiveRunStore } from "./liveRun";
import type { Rest } from "./restCountdown";
import { hangReview, hangReviewDraft, hangSessionOf } from "./hangReview";
import { hangRunDone, type SetLoads } from "./timerView";
import type { TimerRun, WorkoutRun } from "./runParams";
import type { PlannedRun } from "./usePlannedRun";
import { setKey, type SetAt } from "./setsRun";

/**
 * A mix's fingerboard part in its live run: the hang timer's run, whose sets the run's grip rows
 * take as it goes, or the part's rows for its review (each grip by its id, a set never reached
 * at no hangs), with each grip's setup, the first the one its pill sets.
 */
export type FingersPart = PartTimer | PartRows;

/**
 * The hang timer on a grip: `at` is the row its first set writes, and it runs that grip's sets
 * from there. A run saved before grips had rows has no `at` and runs every grip from the first.
 */
export type PartTimer = {
  run: Run<HangPhase>;
  setups: HangSetup[];
  loads?: SetLoads;
  planned?: PlannedRun;
  at?: SetAt;
};

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

/**
 * The part as its review opens it: the rows its timer ended with, or, when the run ends with the
 * timer still going, the sets it held so far; none when it never ran.
 */
export function partEnded(
  part: FingersPart | undefined,
  gripName: (id: string) => string
): PartRows | undefined {
  if (part === undefined || !("run" in part)) return part;
  const { run, setups, planned, loads } = part;
  if (planned === undefined) return undefined;
  const grips = planned.items.map((i) => i.workout.grip);
  const setup = (): HangSetup => setups[0] ?? { edgeMm: 0, loadKg: 0 };
  const done = partRows(
    planned,
    hangRunDone(run, planned, grips, setups, { doses: partDoses(planned), loads }),
    {
      setup,
      gripName,
    }
  );
  return { done, setups, planned };
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
  if (!s.done.some((d) => d.sets.some(heldSet))) return null;
  const { gripId, edgeMm, loadKg, pct, misses, protocol, done } = s;
  return { gripId, edgeMm, loadKg, pct, misses, protocol, done };
}

/** Each grip's dose, as the part runs it. */
export const partDoses = (planned: PlannedRun): Dose[] =>
  planned.items.map((i) => i.dose ?? protocolDose(i.workout));

/** What discarding a live run loses: nothing logged, and the hangs its grips' ticked sets held when any. */
export function discardRunBody(run: Pick<LiveRun, "state"> | null): string {
  const state = run?.state;
  if (state?.player !== "sets") return t("hang.discardRunBody");
  const grips = state.grips ?? [];
  const hangs = state.done
    .filter((d) => grips.includes(d.item))
    .flatMap((d) => d.sets.filter((_, set) => state.ticked.includes(setKey({ item: d.item, set }))))
    .reduce((n, s) => n + Math.max(0, s.reps ?? 1), 0);
  if (hangs === 0) return t("hang.discardRunBody");
  return t("workouts.discardPartBody", { n: hangs });
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
    planned: partDoses(planned),
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

/** Each grip's setup as the part last set it, by the grip's place in the run's rows. */
export function partSetups(
  part: FingersPart,
  places: readonly number[]
): Record<string, HangSetup> {
  return Object.fromEntries(
    part.setups.flatMap((setup, k) => {
      const at =
        "run" in part
          ? rowOf(part, places, k, 0)
          : places[k] === undefined
            ? undefined
            : { item: places[k] };
      return at === undefined ? [] : [[String(at.item), setup]];
    })
  );
}

/** A set the timer reached, as the run's rows take it: where, what it held, and whether it is over. */
export type TimerWrite = { at: SetAt; value: SetDone; ended: boolean };

const rowOf = (part: PartTimer, places: readonly number[], item: number, set: number) => {
  if (part.at !== undefined) return { item: part.at.item, set: part.at.set + set };
  const place = places[item];
  return place === undefined ? undefined : { item: place, set };
};

/** A timer set is over once the run has no work of it left. */
const setEnded = (run: Run<HangPhase>, item: number, set: number): boolean =>
  run.finished !== null ||
  !run.phases.some((p, i) => i >= run.index && p.item === item && p.set === set && isWork(p.kind));

/**
 * What the part's timer has written into the run's rows so far: each set it reached with the
 * hangs held and the load it ran, over once its last hang is behind it. Rows a part saved before
 * grips had rows of their own come back as the sets they held, each one over.
 */
export function timerWrites(part: FingersPart, places: readonly number[]): TimerWrite[] {
  if (!("run" in part))
    return part.done.flatMap((d) => {
      const place = places[d.item];
      return place === undefined
        ? []
        : d.sets.flatMap((value, set) =>
            heldSet(value) ? [{ at: { item: place, set }, value, ended: true }] : []
          );
    });
  const { run, planned, loads } = part;
  if (planned === undefined) return [];
  return setsHeld(run, partDoses(planned)).flatMap((sets, item) =>
    sets.flatMap((held, set) => {
      const at = rowOf(part, places, item, set);
      if (held === null || at === undefined) return [];
      const kg = loads?.[item]?.[set];
      const value = kg === undefined ? held : { ...held, weightKg: kg };
      return [{ at, value, ended: setEnded(run, item, set + 1) }];
    })
  );
}

/** The rows with what the timer wrote laid in, each set it ended ticked; the same rows when it wrote nothing new. */
export function withTimerWrites(
  done: readonly ItemDone[],
  ticked: ReadonlySet<string>,
  writes: readonly TimerWrite[]
): { done: ItemDone[]; ticked: ReadonlySet<string> } | null {
  let changed = false;
  const after = new Set(ticked);
  const rows = done.map((d) => {
    const mine = writes.filter((w) => w.at.item === d.item);
    if (mine.length === 0) return d;
    const sets = [...d.sets];
    for (const { at, value, ended } of mine) {
      const was = sets[at.set];
      if (was === undefined || JSON.stringify(was) !== JSON.stringify(value)) {
        sets[at.set] = was?.rpe === undefined ? value : { ...value, rpe: was.rpe };
        changed = true;
      }
      if (ended && !after.has(setKey(at))) {
        after.add(setKey(at));
        changed = true;
      }
    }
    return { ...d, sets };
  });
  return changed ? { done: rows, ticked: after } : null;
}

/**
 * The part as the run's grip rows hold it, for its review and save: each grip's sets, one left
 * unticked at no hangs; none when no grip set is ticked.
 */
export function partOfRows(
  done: readonly ItemDone[],
  ticked: ReadonlySet<string>,
  places: readonly number[],
  planned: PlannedRun,
  setups: HangSetup[]
): PartRows | undefined {
  const rows = places.map((place, item) => ({
    item,
    exercise: planned.items[item]?.workout.grip ?? "",
    sets: (done.find((d) => d.item === place)?.sets ?? []).map((s, set) =>
      ticked.has(setKey({ item: place, set })) ? s : { ...s, reps: 0 }
    ),
  }));
  return rows.some((r) => r.sets.some(heldSet)) ? { done: rows, setups, planned } : undefined;
}

/** A grip card's timer button: Resume while its timer is paused on it, else from its first open set. */
export type GripTimer = { resume: true } | { resume: false; set: number };

export function gripTimer(
  place: number,
  sets: number,
  ticked: ReadonlySet<string>,
  part: FingersPart | undefined,
  places: readonly number[]
): GripTimer | null {
  if (part !== undefined && "run" in part && part.run.finished === null) {
    const { item, set } = currentPhase(part.run);
    if (rowOf(part, places, item, set - 1)?.item === place) return { resume: true };
  }
  const open = Array.from({ length: sets }, (_, set) => set).find(
    (set) => !ticked.has(setKey({ item: place, set }))
  );
  return open === undefined ? null : { resume: false, set: open };
}

/** The button's words: "Resume timer", "Start timer", "Start timer at set 2". */
export const gripTimerLabel = (g: GripTimer): string =>
  g.resume
    ? t("hang.resumeTimer")
    : g.set === 0
      ? t("hang.startTimer")
      : t("hang.startTimerAt", { n: g.set + 1 });

/** What the hang timer opens on: the paused one to resume, or a grip from row `start` on its sets left. */
export type PartTimerStart = { planned: PlannedRun; resumed: PartTimer | null; at?: SetAt };

export function partTimerStart(
  run: PartOf,
  isGrip: (exercise: string) => boolean,
  fingers: FingersPart | undefined,
  start: SetAt | null,
  rest: Pick<Rest, "endsAt"> | null = null,
  now = Date.now()
): PartTimerStart | null {
  const places = partPlaces(run.items, isGrip);
  if (start === null) {
    if (fingers === undefined || !("run" in fingers) || fingers.run.finished !== null) return null;
    const planned = fingers.planned ?? partPlanned(run, places);
    if (planned === null) return null;
    const resumed = { ...fingers, run: restFrom(fingers.run, rest, now) };
    return { planned, resumed, ...(fingers.at !== undefined && { at: fingers.at }) };
  }
  const item = run.items[start.item];
  if (item === undefined || !places.includes(start.item)) return null;
  const sets = item.dose.sets - start.set;
  if (sets <= 0) return null;
  const items = run.items.map((it, k) =>
    k === start.item ? { ...it, dose: { ...it.dose, sets } } : it
  );
  const planned = partPlanned({ ...run, items }, [start.item]);
  return planned === null ? null : { planned, resumed: null, at: start };
}

/**
 * A paused timer in a rest picks up from the run's rest row, which kept counting while it was
 * minimised: one clock for the rest, whichever screen shows it.
 */
function restFrom(
  run: Run<HangPhase>,
  rest: Pick<Rest, "endsAt"> | null,
  now: number
): Run<HangPhase> {
  const phase = currentPhase(run);
  if (rest === null || run.pausedAt === null || isWork(phase.kind) || phase.kind === "ready")
    return run;
  const left = Math.min(phase.seconds, Math.max(0, (rest.endsAt - now) / 1000));
  return { ...run, pausedAt: now, phaseStartedAt: now - (phase.seconds - left) * 1000 };
}

/** Minimising the hang timer pauses it where it is, so the rows show where it stopped. */
export function pausePartTimer(store: LiveRunStore, workoutId: string, now: number): void {
  const live = store.resumed("/workout/sets", workoutId);
  const state = live?.state;
  if (live === null || state?.player !== "sets") return;
  const part = state.fingers;
  if (part === undefined || !("run" in part)) return;
  if (part.run.finished !== null || part.run.pausedAt !== null) return;
  store.writeAsIs({
    ...live,
    state: { ...state, fingers: { ...part, run: togglePause(part.run, now) } },
  });
}
