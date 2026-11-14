import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import type { HangSetup, PlanLink } from "@sendtally/core/hang";
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
import {
  ON_DARK,
  ON_DARK_LINE,
  ON_DARK_SOFT,
  forToday,
  resumedTimer,
  timerView,
  useHangTimerPlayer,
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
    onFinish: (review) => router.replace(donePath(review)),
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
    />
  );
}
