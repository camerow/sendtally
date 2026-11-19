import {
  currentPhase,
  isWork,
  protocolDose,
  type Dose,
  setOf,
  setsHeld,
  type HangKind,
  type HangPhase,
  type HangSetup,
  type HangWorkout,
  type Run,
  type WeightUnit,
  type SetDone,
} from "@sendtally/core/hang";
import { setKeyOf } from "../activities/done";
import type { HangModel } from "../hang/model";
import { loadLabel, setupLabel } from "../hang/format";
import { timerText, type TimerText } from "../hang/timerText";
import { t } from "../i18n";
import { phaseLook, type PhaseLook } from "./phaseLook";
import type { TimerRun } from "./runParams";
import type { PlannedRun } from "./usePlannedRun";

/** What the run runs: its planned items, each on its grip with today's setup. */
export type TimerItems = {
  planned: PlannedRun;
  grips: readonly string[];
  setups: readonly HangSetup[];
  unit: WeightUnit;
};

export type TimerView = Omit<TimerText, "fail"> & {
  /** The item running now, on its grip and setup. */
  current: HangWorkout;
  gripId: string;
  /** "20 mm · +5 kg", its setup for today. */
  setup: string;
  /** "20 mm" on a hang, none on a ground pull. */
  edge: string | null;
  look: PhaseLook;
  working: boolean;
  /** Lifted on a pull, Pause or Resume otherwise. */
  primary: string;
  /** What the ring says it does when tapped. */
  ring: string;
  /** Came off early or Missed lift, while a working phase runs. */
  fail: string | null;
};

/** Every word and colour the hang timer shows for where its run is now. */
export function timerView(
  run: Run<HangPhase>,
  secondsLeft: number,
  { planned, grips, setups, unit }: TimerItems
): TimerView {
  const phase = currentPhase(run);
  const { items } = planned;
  const current = (items[phase.item] ?? items[0]).workout;
  const setup = setups[phase.item] ?? { edgeMm: 0, loadKg: 0 };
  const pull = phase.taps > 0;
  const working = isWork(phase.kind);
  const paused = run.pausedAt !== null;
  const text = timerText(
    run,
    secondsLeft,
    loadLabel(current.kind, setup.loadKg, unit),
    current.sets
  );
  const pause = paused ? t("hang.resume") : t("hang.pause");
  return {
    ...text,
    current,
    gripId: grips[phase.item] ?? current.grip,
    setup: setupLabel(current.kind, setup, unit),
    edge: current.kind === "hang" ? t("hang.edgeMm", { n: setup.edgeMm }) : null,
    look: phaseLook(working, phase.kind === "ready" && run.index === 0),
    working,
    primary: pull ? t("hang.lifted") : pause,
    ring: pull ? t("hang.logLift") : pause,
    fail: working && !paused ? text.fail : null,
  };
}

/** What a timer run did, for its review: the sets held against each grip's dose, and those it came off. */
export function hangRunDone(
  run: Run<HangPhase>,
  planned: PlannedRun,
  grips: readonly string[],
  setups: HangSetup[],
  {
    doses = planned.items.map((i) => protocolDose(i.workout)),
    loads,
  }: { doses?: readonly Dose[]; loads?: SetLoads | undefined } = {}
): TimerRun {
  const held = setsHeld(run, doses);
  const dose = (item: number): SetDone => setOf(doses[item] ?? { sets: 0 });
  const load = (item: number, set: number): Pick<SetDone, "weightKg"> => {
    const kg = loads?.[item]?.[set];
    return kg === undefined ? {} : { weightKg: kg };
  };
  return {
    done: held.map((sets, item) => ({
      item,
      exercise: grips[item] ?? "",
      sets: sets.map((s, set) => ({ ...(s ?? dose(item)), ...load(item, set) })),
    })),
    off: held.flatMap((sets, item) =>
      sets.flatMap((s, set) => (s === null ? [setKeyOf(item, set)] : []))
    ),
    setups: setups.map((setup, item) => {
      const last = loads?.[item]?.at(-1);
      return last === undefined ? setup : { ...setup, loadKg: last };
    }),
    startedAt: run.startedAt,
  };
}

/** One item of the run: its grip, whether it hangs, and the setup its plan gives it. */
export type TodayEntry = { gripId: string; kind: HangKind; planned: HangSetup };

export type ForToday = {
  /** Each item's grip, the first the one the run was started on. */
  grips: string[];
  entries: TodayEntry[];
  /** "Half crimp · Winter base · W4" over Change for today. */
  kicker: string;
};

/** The grips and planned setups a run's Change for today starts from. */
export function forToday(
  planned: PlannedRun,
  gripId: string,
  model: Pick<HangModel, "gripName" | "setup">,
  blockTag: string | null
): ForToday {
  const grips = planned.items.map((item, i) => (i === 0 ? gripId : item.workout.grip));
  const entries = planned.items.map(({ workout, dose }, i): TodayEntry => {
    const grip = grips[i] ?? workout.grip;
    return { gripId: grip, kind: workout.kind, planned: model.setup(workout, grip, dose) };
  });
  const kicker = [model.gripName(grips[0] ?? planned.items[0].workout.grip), blockTag]
    .filter((x) => x !== null)
    .join(" · ");
  return { grips, entries, kicker };
}

/** Each item's load set by set, in kg: what each set hangs, or hung, at. */
export type SetLoads = number[][];

/** Every set of every item at its setup's load, as a run starts. */
export const startLoads = (planned: PlannedRun, setups: readonly HangSetup[]): SetLoads =>
  planned.items.map((i, item) =>
    Array.from({ length: i.workout.sets }, () => setups[item]?.loadKg ?? 0)
  );

/** The set a load change starts from: the one under way, or the next during a set rest. */
const loadFrom = (phase: HangPhase): number =>
  phase.kind === "setrest" ? phase.set : phase.set - 1;

/** The load the timer shows now: the set under way's, or the next one's. */
export function loadNow(loads: SetLoads, run: Run<HangPhase>): number {
  const phase = currentPhase(run);
  const sets = loads[phase.item] ?? [];
  return sets[Math.min(loadFrom(phase), sets.length - 1)] ?? 0;
}

/** `kg` on the set under way and every set of its item still to come; sets already hung keep theirs. */
export function changeLoad(loads: SetLoads, run: Run<HangPhase>, kg: number): SetLoads {
  const phase = currentPhase(run);
  const from = loadFrom(phase);
  return loads.map((sets, item) =>
    item === phase.item ? sets.map((old, set) => (set >= from ? kg : old)) : sets
  );
}
