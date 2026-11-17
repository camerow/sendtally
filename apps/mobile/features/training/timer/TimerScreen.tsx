import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import type { HangPhase, HangSetup, PlanLink, Run } from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { blockTagOf, usePlan } from "@sendtally/features/training";
import { Icon } from "../../../components/Icon";
import { useApi } from "../../../lib/api";
import { press } from "../../../lib/press";
import { WorkoutNotes } from "../components/WorkoutNotes";
import { type } from "../type";
import { useHangData } from "../data/HangDataContext";
import { usePlannedRun, type PlannedRun } from "./usePlannedRun";
import { donePath } from "../done/doneParams";
import { RepDots } from "./RepDots";
import { SetArrows } from "./SetArrows";
import { ForTodaySheet } from "./ForTodaySheet";
import { TimerFrame } from "./TimerFrame";
import { TimerRing } from "./TimerRing";
import { useTimer } from "./useTimer";
import { useTimerSounds } from "./useTimerSounds";
import { liveRun } from "../../live-session/liveRun";
import { leaveLiveScreen } from "../../../components/MinimiseButton";
import { useGrips } from "@sendtally/features/hang";
import {
  ON_DARK,
  ON_DARK_LINE,
  ON_DARK_SOFT,
  forToday,
  partPlaces,
  partPlanned,
  partRows,
  readWorkoutRun,
  resumedTimer,
  timerView,
  useHangTimerPlayer,
  type DoneParams,
  type FingersPart,
  type ForToday,
  type ResumedTimer,
} from "@sendtally/features/workouts";

function Timer({
  planned,
  today: { grips, entries, kicker },
  setups,
  onSetups,
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
  onSetups: (setups: HangSetup[]) => void;
  link: PlanLink;
  session: number;
  /** Where the run was when it was minimised or the app closed. */
  resumed: ResumedTimer | null;
  /** Ends the run as it opens, for its review. */
  end: boolean;
  onFinish: (review: DoneParams) => void;
  /** Keeps the run in a mix's live run, for its fingerboard part. */
  write?: (run: Run<HangPhase>, setups: HangSetup[]) => void;
}): React.ReactElement {
  const { model } = useHangData();
  const [changing, setChanging] = React.useState(false);
  const workout = planned.items[0].workout;
  const playSound = useTimerSounds();
  const player = useHangTimerPlayer({
    planned,
    grips,
    setups,
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
  const view = timerView(run, secondsLeft, {
    planned,
    grips,
    setups,
    unit: model.settings.units,
  });

  return (
    <TimerFrame
      timer={timer}
      name={workout.name}
      meta={kindLabel("hangboard")}
      workoutId={workout.id}
      controls={{
        color: view.look.fill,
        primary: view.primary,
        next: view.next,
        fail: view.fail,
        onPrimary: timer.primary,
        onFail: timer.fail,
      }}
    >
      <View style={{ alignItems: "center", gap: 10 }}>
        <Pressable
          onPress={() => setChanging(true)}
          accessibilityRole="button"
          accessibilityLabel={t("hang.changeToday")}
          style={press({
            height: 36,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 14,
            borderRadius: 18,
            borderWidth: 1.5,
            borderColor: ON_DARK_LINE,
          })}
        >
          <Text style={[type.mono, { fontSize: 13, color: ON_DARK }]}>
            {`${model.gripName(view.gripId)} · ${view.setup}`}
          </Text>
          <Icon name="pencil" size={14} strokeWidth={2} color={ON_DARK_SOFT} />
        </Pressable>
        <WorkoutNotes workoutId={workout.id} dark />
      </View>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 22 }}>
        <TimerRing
          progress={progress}
          color={view.look.mark}
          labelColor={view.look.fill}
          phaseKey={run.index}
          label={view.label}
          big={view.big}
          hint={view.hint}
          accessibilityLabel={view.ring}
          onPress={timer.primary}
        />
        <View style={{ alignItems: "center", gap: 10 }}>
          <SetArrows timer={timer} label={view.setLine} />
          <RepDots reps={view.current.reps} marks={run.marks} working={view.working} />
        </View>
      </View>
      {changing && (
        <ForTodaySheet
          kicker={kicker}
          entries={entries}
          setups={setups}
          onChange={onSetups}
          onClose={() => setChanging(false)}
        />
      )}
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
  const { model, today } = useHangData();
  const plan = usePlan(useApi()).state;
  const planned = usePlannedRun(workoutId, link, session);
  const [resumed] = React.useState(() => resumedTimer(liveRun, "/workout/timer", workoutId));
  const [setups, setSetups] = React.useState<HangSetup[] | null>(resumed?.setups ?? null);
  if (planned === undefined) return null;
  const forRun = forToday(
    planned,
    gripId,
    model,
    plan.status === "ready" ? blockTagOf(plan.data, link.membershipId, today) : null
  );
  return (
    <Timer
      planned={planned}
      today={forRun}
      setups={setups ?? forRun.entries.map((e) => e.planned)}
      onSetups={setSetups}
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
  const [setups, setSetups] = React.useState<HangSetup[] | null>(resumed?.setups ?? null);
  if (run === null || state === undefined) return null;
  const planned = partPlanned(run, partPlaces(run.items, isGrip));
  if (planned === null) return null;
  const forRun = forToday(planned, planned.items[0].workout.grip, model, null);
  const keep = (part: FingersPart): void => {
    const now = liveRun.resumed("/workout/sets", workoutId);
    if (now?.state.player === "sets")
      liveRun.writeAsIs({ ...now, state: { ...now.state, fingers: part } });
  };
  return (
    <Timer
      planned={planned}
      today={forRun}
      setups={setups ?? forRun.entries.map((e) => e.planned)}
      onSetups={setSetups}
      link={run.link}
      session={0}
      resumed={resumed}
      end={false}
      write={(timerRun, now) => {
        if (timerRun.finished === null) keep({ run: timerRun, setups: now });
      }}
      onFinish={({ run: done }) => {
        if (done !== null)
          keep({ done: partRows(planned, done, model), setups: done.setups, planned });
        leaveLiveScreen();
      }}
    />
  );
}
