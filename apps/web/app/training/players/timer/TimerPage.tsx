import React from "react";
import { useNavigate } from "react-router";
import {
  clampLoad,
  fromUnit,
  toUnit,
  type HangPhase,
  type HangSetup,
  type PlanLink,
  type Run,
} from "@sendtally/core/hang";
import { hangLoadText } from "@sendtally/features/activities";
import { useGrips } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
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
  usePlannedRun,
  type DoneParams,
  type FingersPart,
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
  const step = unit === "lb" ? 1 : 0.5;
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
                  clampLoad(view.current.kind, fromUnit(toUnit(kg, unit) + d * step, unit))
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
  if (run === null) return null;
  const planned = partPlanned(run, partPlaces(run.items, isGrip));
  if (planned === null) return null;
  const forRun = forToday(planned, planned.items[0].workout.grip, model);
  const keep = (part: FingersPart): void => {
    const now = store.resumed("/workout/sets", workoutId);
    if (now?.state.player === "sets")
      store.writeAsIs({ ...now, state: { ...now.state, fingers: part } });
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
        back();
      }}
    />
  );
}
