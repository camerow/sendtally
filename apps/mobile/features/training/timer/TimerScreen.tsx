import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import {
  clampLoad,
  fromUnit,
  toUnit,
  type HangPhase,
  type HangSetup,
  type PlanLink,
  type Run,
  stepOnGrid,
  timerLoadStep,
} from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { hangLoadText, useGrips } from "@sendtally/features/hang";
import {
  ON_DARK,
  ON_DARK_SOFT,
  changeLoad,
  forToday,
  loadNow,
  partPlaces,
  partPlanned,
  partRows,
  readWorkoutRun,
  resumedTimer,
  startLoads,
  timerView,
  useHangTimerPlayer,
  type DoneParams,
  type FingersPart,
  type ForToday,
  type ResumedTimer,
  type SetLoads,
} from "@sendtally/features/workouts";
import { leaveLiveScreen } from "../../../components/MinimiseButton";
import { useApi } from "../../../lib/api";
import { liveRun } from "../../live-session/liveRun";
import { Stepper } from "../components/Stepper";
import { WorkoutNotes } from "../components/WorkoutNotes";
import { useHangData } from "../data/HangDataContext";
import { donePath } from "../done/doneParams";
import { type } from "../type";
import { RepDots } from "./RepDots";
import { TimerFrame } from "./TimerFrame";
import { TimerRing } from "./TimerRing";
import { usePlannedRun, type PlannedRun } from "./usePlannedRun";
import { useTimer } from "./useTimer";
import { useTimerSounds } from "./useTimerSounds";

function Timer({
  planned,
  today: { grips },
  setups,
  link,
  session,
  resumed,
  end,
  onFinish,
  write,
}: {
  planned: PlannedRun;
  today: ForToday;
  setups: HangSetup[];
  link: PlanLink;
  session: number;
  /** Where the run was when it was minimised or the app closed. */
  resumed: ResumedTimer | null;
  /** Ends the run as it opens, for its review. */
  end: boolean;
  onFinish: (review: DoneParams) => void;
  /** Keeps the run in a mix's live run, for its fingerboard part. */
  write?: (run: Run<HangPhase>, setups: HangSetup[], loads: SetLoads | undefined) => void;
}): React.ReactElement {
  const { model } = useHangData();
  const unit = model.settings.units;
  const [loads, setLoads] = React.useState(() => resumed?.loads ?? startLoads(planned, setups));
  const workout = planned.items[0].workout;
  const playSound = useTimerSounds();
  const player = useHangTimerPlayer({
    planned,
    grips,
    setups,
    loads,
    link,
    session,
    resumed,
    store: liveRun,
    playSound,
    end,
    onFinish,
    ...(write !== undefined && { write }),
  });
  const timer = useTimer(player);
  const { run, secondsLeft, progress } = timer;
  const view = timerView(run, secondsLeft, { planned, grips, setups });
  const kg = loadNow(loads, run);
  const step = timerLoadStep(unit);
  const setLoad = (n: number): void =>
    setLoads(changeLoad(loads, run, clampLoad(view.current.kind, fromUnit(n, unit))));

  return (
    <TimerFrame timer={timer} controls={{ color: view.look.fill, primary: view.primary }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 24 }}>
        <View style={{ alignItems: "center", gap: 8 }}>
          <Text style={[type.mono, { fontSize: 13, color: ON_DARK_SOFT }]}>
            {[model.gripName(view.gripId), view.edge].filter((x) => x !== null).join(" · ")}
          </Text>
          <Stepper
            surface="dark"
            text={hangLoadText(kg, unit)}
            label={t("hang.load")}
            onStep={(d) => setLoad(stepOnGrid(toUnit(kg, unit), step, d))}
            decreaseLabel={t("hang.decrease", { field: t("hang.load") })}
            increaseLabel={t("hang.increase", { field: t("hang.load") })}
          />
          <WorkoutNotes workoutId={workout.id} dark />
        </View>
        <TimerRing
          progress={progress}
          color={view.look.mark}
          labelColor={view.look.fill}
          phaseKey={run.index}
          label={view.label}
          big={view.big}
          accessibilityLabel={view.ring}
          onPress={timer.primary}
        />
        <View style={{ alignItems: "center", gap: 10 }}>
          <Text style={[type.monoBold, { fontSize: 15, color: ON_DARK }]}>{view.setLine}</Text>
          <RepDots reps={view.current.reps} marks={run.marks} working={view.working} />
        </View>
      </View>
    </TimerFrame>
  );
}

export type TimerScreenProps = {
  workoutId: string;
  gripId: string;
  link: PlanLink;
  /** How many sessions of the workout came before this one. */
  session: number;
  /** Ends the running workout as it opens, straight to its review. */
  end?: boolean;
};

export function TimerScreen({
  workoutId,
  gripId,
  link,
  session,
  end = false,
}: TimerScreenProps): React.ReactElement | null {
  const { model } = useHangData();
  const planned = usePlannedRun(workoutId, link, session);
  const [resumed] = React.useState(() => resumedTimer(liveRun, "/workout/timer", workoutId));
  if (planned === undefined) return null;
  const forRun = forToday(planned, gripId, model);
  return (
    <Timer
      planned={planned}
      today={forRun}
      setups={resumed?.setups ?? forRun.entries.map((e) => e.planned)}
      link={link}
      session={session}
      resumed={resumed}
      end={end}
      onFinish={(review) => router.replace(donePath(review))}
    />
  );
}

/**
 * A mix's fingerboard part in the hang timer: its grips in order, kept in the workout's live run.
 * Minimise goes back to the workout view; End or the last hang hands the sets it held back there
 * as editable rows, with no review of its own.
 */
export function PartTimerScreen({ workoutId }: { workoutId: string }): React.ReactElement | null {
  const { model } = useHangData();
  const { isGrip } = useGrips(useApi());
  const [live] = React.useState(() => liveRun.resumed("/workout/sets", workoutId));
  const run = live === null ? null : readWorkoutRun(live.params);
  const state = live?.state.player === "sets" ? live.state : undefined;
  const fingers = state?.fingers;
  const resumed = fingers !== undefined && "run" in fingers ? fingers : null;
  if (run === null || state === undefined) return null;
  const planned = partPlanned(run, partPlaces(run.items, isGrip));
  if (planned === null) return null;
  const forRun = forToday(planned, planned.items[0].workout.grip, model);
  const keep = (part: FingersPart): void => {
    const now = liveRun.resumed("/workout/sets", workoutId);
    if (now?.state.player === "sets")
      liveRun.writeAsIs({ ...now, state: { ...now.state, fingers: part } });
  };
  return (
    <Timer
      planned={planned}
      today={forRun}
      setups={resumed?.setups ?? forRun.entries.map((e) => e.planned)}
      link={run.link}
      session={0}
      resumed={resumed}
      end={false}
      write={(timerRun, now, loads) => {
        if (timerRun.finished === null)
          keep({ run: timerRun, setups: now, ...(loads !== undefined && { loads }), planned });
      }}
      onFinish={({ run: done }) => {
        if (done !== null)
          keep({ done: partRows(planned, done, model), setups: done.setups, planned });
        leaveLiveScreen();
      }}
    />
  );
}
