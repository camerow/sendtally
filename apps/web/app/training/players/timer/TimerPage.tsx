import React from "react";
import { useNavigate } from "react-router";
import type { HangPhase, HangSetup, PlanLink, Run } from "@sendtally/core/hang";
import { useGrips } from "@sendtally/features/hang";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { blockTagOf, usePlan } from "@sendtally/features/training";
import {
  forToday,
  partPlaces,
  partPlanned,
  partRows,
  readWorkoutRun,
  resumedTimer,
  timerView,
  useHangTimerPlayer,
  usePlannedRun,
  type DoneParams,
  type FingersPart,
  type ForToday,
  type PlannedRun,
  type ResumedTimer,
} from "@sendtally/features/workouts";
import { Icon } from "../../../components/Icon";
import { playTone } from "../../../lib/tones";
import { useAppApi } from "../../../lib/useAppApi";
import { useGoBack } from "../../../lib/useGoBack";
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
  onFinish: (review: DoneParams) => void;
  /** Keeps the run in a mix's live run, for its fingerboard part. */
  write?: (run: Run<HangPhase>, setups: HangSetup[]) => void;
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
  onFinish,
  write,
}: TimerProps): React.ReactElement {
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
    onFinish,
    ...(write !== undefined && { write }),
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
  const navigate = useNavigate();
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
      onFinish={(review) => void navigate(donePath(review), { replace: true })}
    />
  );
}

/**
 * A mix's fingerboard part in the hang timer: its grips in order, kept in the workout's live run.
 * Minimise goes back to the workout page; End or the last hang hands the sets it held back there
 * as editable rows, with no review of its own.
 */
export function PartTimerPage({ workoutId }: { workoutId: string }): React.ReactElement | null {
  const { model } = useHangData();
  const { isGrip } = useGrips(useAppApi());
  const store = useLiveRunStore();
  const back = useGoBack("/app/workout/sets");
  const [live] = React.useState(() => store.resumed("/workout/sets", workoutId));
  const run = live === null ? null : readWorkoutRun(live.params);
  const fingers = live?.state.player === "sets" ? live.state.fingers : undefined;
  const resumed = fingers !== undefined && "run" in fingers ? fingers : null;
  const [setups, setSetups] = React.useState<HangSetup[] | null>(resumed?.setups ?? null);
  if (run === null) return null;
  const planned = partPlanned(run, partPlaces(run.items, isGrip));
  if (planned === null) return null;
  const forRun = forToday(planned, planned.items[0].workout.grip, model, null);
  const keep = (part: FingersPart): void => {
    const now = store.resumed("/workout/sets", workoutId);
    if (now?.state.player === "sets")
      store.writeAsIs({ ...now, state: { ...now.state, fingers: part } });
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
        back();
      }}
    />
  );
}
