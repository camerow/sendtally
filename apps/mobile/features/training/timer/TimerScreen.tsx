import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import {
  bumpLoad,
  type HangPhase,
  type HangSetup,
  type PlanLink,
  type Run,
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
  partTimerStart,
  pausePartTimer,
  readWorkoutRun,
  resumedTimer,
  startLoads,
  timerView,
  useHangTimerPlayer,
  type DoneParams,
  type FingersPart,
  type ForToday,
  type ResumedTimer,
  type SetAt,
  type SetLoads,
} from "@sendtally/features/workouts";
import { NO_PLAN } from "@sendtally/features/training";
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
            onStep={(d) =>
              setLoads(
                changeLoad(
                  loads,
                  run,
                  bumpLoad(view.current.kind, kg, unit, d, timerLoadStep(unit))
                )
              )
            }
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
 * A grip of a mix in the hang timer, from row `start` on its sets left, or the paused one when
 * none is given, kept in the workout's live run, whose rows take every set it holds. Minimise
 * pauses it and goes back to the workout view; its last hang or End goes back there too.
 */
export function PartTimerScreen({
  workoutId,
  start,
}: {
  workoutId: string;
  start: SetAt | null;
}): React.ReactElement | null {
  const { model } = useHangData();
  const { isGrip } = useGrips(useApi());
  const [opened] = React.useState(() => {
    const live = liveRun.resumed("/workout/sets", workoutId);
    const run = live === null ? null : readWorkoutRun(live.params);
    const fingers = live?.state.player === "sets" ? live.state.fingers : undefined;
    return run === null ? null : partTimerStart(run, isGrip, fingers, start);
  });
  React.useEffect(() => () => pausePartTimer(liveRun, workoutId, Date.now()), [workoutId]);
  if (opened === null) return null;
  const { planned, resumed, at } = opened;
  const forRun = forToday(planned, planned.items[0].workout.grip, model);
  return (
    <Timer
      planned={planned}
      today={forRun}
      setups={resumed?.setups ?? forRun.entries.map((e) => e.planned)}
      link={NO_PLAN}
      session={0}
      resumed={resumed}
      end={false}
      write={(timerRun, now, loads) => {
        const live = liveRun.resumed("/workout/sets", workoutId);
        if (live?.state.player !== "sets") return;
        const part: FingersPart = {
          run: timerRun,
          setups: now,
          ...(loads !== undefined && { loads }),
          planned,
          ...(at !== undefined && { at }),
        };
        liveRun.writeAsIs({ ...live, state: { ...live.state, fingers: part } });
      }}
      onFinish={() => leaveLiveScreen()}
    />
  );
}
