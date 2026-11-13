import React from "react";
import { useNavigate } from "react-router";
import type { HangSetup, PlanLink } from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { blockTagOf, usePlan } from "@sendtally/features/training";
import {
  forToday,
  resumedTimer,
  timerView,
  useHangTimerPlayer,
  usePlannedRun,
  type ForToday,
  type PlannedRun,
  type ResumedTimer,
} from "@sendtally/features/workouts";
import { Icon } from "../../../components/Icon";
import { playTone } from "../../../lib/tones";
import { useAppApi } from "../../../lib/useAppApi";
import { useLiveRunStore } from "../../../lib/useLiveRun";
import { useHangData } from "../../data/HangDataContext";
import { useLibrary, workoutIn } from "../../library/useLibrary";
import { donePath } from "../../log/paths";
import { ForTodaySheet } from "./ForTodaySheet";
import { RepDots } from "./RepDots";
import { SetArrows } from "./SetArrows";
import { TimerFrame } from "./TimerFrame";
import { TimerRing } from "./TimerRing";

type TimerProps = {
  planned: PlannedRun;
  today: ForToday;
  setups: HangSetup[];
  onSetups: (setups: HangSetup[]) => void;
  link: PlanLink;
  session: number;
  resumed: ResumedTimer | null;
  end: boolean;
};

function Timer({
  planned,
  today: { grips, entries, kicker },
  setups,
  onSetups,
  link,
  session,
  resumed,
  end,
}: TimerProps): React.ReactElement {
  const navigate = useNavigate();
  const { model } = useHangData();
  const [changing, setChanging] = React.useState(false);
  const workout = planned.items[0].workout;
  const timer = useHangTimerPlayer({
    planned,
    grips,
    setups,
    link,
    session,
    resumed,
    store: useLiveRunStore(),
    playSound: playTone,
    end,
    onFinish: (review) => void navigate(donePath(review), { replace: true }),
  });
  const { run, secondsLeft } = timer;
  const view = timerView(run, secondsLeft, {
    planned,
    grips,
    setups,
    unit: model.settings.units,
  });
  const targetRpe = workoutIn(useLibrary())(workout.id)?.targetRpe;

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
      <div className="timer-setup">
        <button
          type="button"
          className="timer-setup-pill"
          aria-label={t("hang.changeToday")}
          onClick={() => setChanging(true)}
        >
          {`${model.gripName(view.gripId)} · ${view.setup}`}
          <Icon name="pencil" size={14} strokeWidth={2} />
        </button>
        {targetRpe != null && (
          <span className="timer-target">{t("plan.targetValue", { n: targetRpe })}</span>
        )}
      </div>
      <div className="timer-middle">
        <TimerRing
          color={view.look.mark}
          labelColor={view.look.fill}
          phaseKey={run.index}
          label={view.label}
          big={view.big}
          hint={view.hint}
          ariaLabel={view.ring}
          onPress={timer.primary}
        />
        <div className="timer-sets">
          <SetArrows timer={timer} label={view.setLine} />
          <RepDots reps={view.current.reps} marks={run.marks} working={view.working} />
        </div>
      </div>
      <ForTodaySheet
        open={changing}
        kicker={kicker}
        entries={entries}
        setups={setups}
        onChange={onSetups}
        onClose={() => setChanging(false)}
      />
    </TimerFrame>
  );
}

export type TimerPageProps = {
  workoutId: string;
  gripId: string;
  link: PlanLink;
  /** How many sessions of the workout came before this one. */
  session: number;
  /** Ends the running workout as it opens, straight to its review. */
  end: boolean;
};

/** A hangboard workout in the timer: the ring, its sets and reps, and Change for today. */
export function TimerPage({
  workoutId,
  gripId,
  link,
  session,
  end,
}: TimerPageProps): React.ReactElement | null {
  const api = useAppApi();
  const { model, today } = useHangData();
  const plan = usePlan(api).state;
  const planned = usePlannedRun(api, model, workoutId, link, session);
  const store = useLiveRunStore();
  const [resumed] = React.useState(() => resumedTimer(store, "/workout/timer", workoutId));
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
