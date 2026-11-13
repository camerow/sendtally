import {
  currentPhase,
  isWork,
  protocolDose,
  setsHeld,
  type HangKind,
  type HangPhase,
  type HangSetup,
  type Run,
  type SetDone,
} from "@sendtally/core/hang";
import { setKeyOf } from "../activities/done";
import type { HangModel } from "../hang/model";
import { timerText, type TimerText } from "../hang/timerText";
import { t } from "../i18n";
import { phaseLook, type PhaseLook } from "./phaseLook";
import type { TimerRun } from "./runParams";
import type { PlannedRun } from "./usePlannedRun";

export type TimerView = Omit<TimerText, "fail"> & {
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
  run: Run,
  secondsLeft: number,
  loadText: string,
  sets: number
): TimerView {
  const phase = currentPhase(run);
  const pull = phase.taps > 0;
  const working = isWork(phase.kind);
  const paused = run.pausedAt !== null;
  const text = timerText(run, secondsLeft, loadText, sets);
  const pause = paused ? t("hang.resume") : t("hang.pause");
  return {
    ...text,
    look: phaseLook(working, phase.kind === "ready" && run.index === 0),
    working,
    primary: pull ? t("hang.lifted") : pause,
    ring: pull ? t("hang.logLift") : pause,
    fail: working && !paused ? text.fail : null,
  };
}

/** What a finished timer run did, for its review: the sets held, and those it came off. */
export function hangRunDone(
  run: Run<HangPhase>,
  planned: PlannedRun,
  grips: readonly string[],
  setups: HangSetup[]
): TimerRun {
  const doses = planned.items.map((i) => protocolDose(i.workout));
  const held = setsHeld(run, doses);
  const dose = (item: number): SetDone => {
    const { sets: _, ...d } = doses[item] ?? { sets: 0 };
    return d;
  };
  return {
    done: held.map((sets, item) => ({
      item,
      exercise: grips[item] ?? "",
      sets: sets.map((s) => s ?? dose(item)),
    })),
    off: held.flatMap((sets, item) =>
      sets.flatMap((s, set) => (s === null ? [setKeyOf(item, set)] : []))
    ),
    setups,
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
