import React from "react";
import { useNavigate } from "react-router";
import {
  bumpLoad,
  type HangPhase,
  type HangSetup,
  type PlanLink,
  type Run,
  timerLoadStep,
} from "@sendtally/core/hang";
import { hangLoadText, useGrips } from "@sendtally/features/hang";
import { NO_PLAN } from "@sendtally/features/training";
import { t } from "@sendtally/features/i18n";
import {
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
  usePlannedRun,
  type DoneParams,
  type FingersPart,
  type SetAt,
  type ForToday,
  type PlannedRun,
  type ResumedTimer,
  type SetLoads,
} from "@sendtally/features/workouts";
import { playTone } from "../../../lib/tones";
import { useAppApi } from "../../../lib/useAppApi";
import { useGoBack } from "../../../lib/useGoBack";
import { useLiveRunStore } from "../../../lib/useLiveRun";
import { Stepper } from "../../components/Stepper";
import { useHangData } from "../../data/HangDataContext";
import { donePath } from "../../log/paths";
import { RepDots } from "./RepDots";
import { TimerFrame } from "./TimerFrame";
import { TimerRing } from "./TimerRing";

type TimerProps = {
  planned: PlannedRun;
  today: ForToday;
  setups: HangSetup[];
  link: PlanLink;
  session: number;
  /** Where the run was when it was minimised or the page closed. */
  resumed: ResumedTimer | null;
  end: boolean;
  onFinish: (review: DoneParams) => void;
  /** Keeps the run in a mix's live run, for its fingerboard part. */
  write?: (run: Run<HangPhase>, setups: HangSetup[], loads: SetLoads | undefined) => void;
};

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
}: TimerProps): React.ReactElement {
  const { model } = useHangData();
  const unit = model.settings.units;
  const [loads, setLoads] = React.useState(() => resumed?.loads ?? startLoads(planned, setups));
  const timer = useHangTimerPlayer({
    planned,
    grips,
    setups,
    loads,
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
  const view = timerView(run, secondsLeft, { planned, grips, setups });
  const kg = loadNow(loads, run);
  const load = t("hang.load");

  return (
    <TimerFrame timer={timer} controls={{ color: view.look.fill, primary: view.primary }}>
      <div className="timer-middle">
        <div className="timer-setup">
          <span className="timer-grip">
            {[model.gripName(view.gripId), view.edge].filter((x) => x !== null).join(" · ")}
          </span>
          <Stepper
            dark
            onStep={(d) =>
              setLoads(
                changeLoad(
                  loads,
                  run,
                  bumpLoad(view.current.kind, kg, unit, d, timerLoadStep(unit))
                )
              )
            }
            decreaseLabel={t("hang.decrease", { field: load })}
            increaseLabel={t("hang.increase", { field: load })}
          >
            <span className="timer-load" aria-label={load}>
              {hangLoadText(kg, unit)}
            </span>
          </Stepper>
        </div>
        <TimerRing
          color={view.look.mark}
          labelColor={view.look.fill}
          phaseKey={run.index}
          label={view.label}
          big={view.big}
          ariaLabel={view.ring}
          onPress={timer.primary}
        />
        <div className="timer-sets">
          <span className="timer-set-line">{view.setLine}</span>
          <RepDots reps={view.current.reps} marks={run.marks} working={view.working} />
        </div>
      </div>
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

/** A hangboard workout in the timer: the grip and its load, the ring, and its sets and reps. */
export function TimerPage({
  workoutId,
  gripId,
  link,
  session,
  end,
}: TimerPageProps): React.ReactElement | null {
  const { model } = useHangData();
  const navigate = useNavigate();
  const planned = usePlannedRun(useAppApi(), model, workoutId, link, session);
  const store = useLiveRunStore();
  const [resumed] = React.useState(() => resumedTimer(store, "/workout/timer", workoutId));
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
      onFinish={(review) => void navigate(donePath(review), { replace: true })}
    />
  );
}

/**
 * A grip of a mix in the hang timer, from row `start` on its sets left, or the paused one when
 * none is given, kept in the workout's live run, whose rows take every set it holds. Minimise
 * pauses it and goes back to the workout page; its last hang or End goes back there too.
 */
export function PartTimerPage({
  workoutId,
  start,
}: {
  workoutId: string;
  start: SetAt | null;
}): React.ReactElement | null {
  const { model } = useHangData();
  const { isGrip } = useGrips(useAppApi());
  const store = useLiveRunStore();
  const back = useGoBack("/app/workout/sets");
  const [opened] = React.useState(() => {
    const live = store.resumed("/workout/sets", workoutId);
    const run = live === null ? null : readWorkoutRun(live.params);
    const fingers = live?.state.player === "sets" ? live.state.fingers : undefined;
    return run === null ? null : partTimerStart(run, isGrip, fingers, start);
  });
  React.useEffect(() => () => pausePartTimer(store, workoutId, Date.now()), [store, workoutId]);
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
        const live = store.resumed("/workout/sets", workoutId);
        if (live?.state.player !== "sets") return;
        const part: FingersPart = {
          run: timerRun,
          setups: now,
          ...(loads !== undefined && { loads }),
          planned,
          ...(at !== undefined && { at }),
        };
        store.writeAsIs({ ...live, state: { ...live.state, fingers: part } });
      }}
      onFinish={() => back()}
    />
  );
}
