import React from "react";
import { useNavigate } from "react-router";
import { useActivities, useWeightUnit } from "@sendtally/features/activities";
import { formatNumber, t } from "@sendtally/features/i18n";
import { useLiveSession } from "@sendtally/features/log-session";
import { useExercises } from "@sendtally/features/statistics";
import {
  afterKey,
  heldSeconds,
  setKey,
  useSetsPlayer,
  type SetAt,
  type WorkoutRun,
} from "@sendtally/features/workouts";
import { useAppApi } from "../../lib/useAppApi";
import { useExerciseTallyStorage, useLiveRunStore } from "../../lib/useLiveRun";
import { ClimbingCard } from "./ClimbingCard";
import { FoldedSetsCard } from "./FoldedSetsCard";
import { HoldButton } from "./HoldButton";
import { HoldRow } from "./HoldRow";
import { PlayerFrame } from "./PlayerFrame";
import { RestPreview } from "./RestPreview";
import { RestRow } from "./RestRow";
import { SetsCard } from "./SetsCard";
import { useFinishRun } from "./useFinishRun";

/**
 * A lifting workout as a set table on a clock from Start: tick each set as it is done, rest
 * in line after it, then log what was done. A climbing exercise is a card instead, whose Start
 * logs it on the workout tally; its climbs come back as its sets.
 */
export function SetsPage({ run, end }: { run: WorkoutRun; end: boolean }): React.ReactElement {
  const api = useAppApi();
  const navigate = useNavigate();
  const unit = useWeightUnit(api);
  const activities = useActivities(api).state;
  const exercises = useExercises(api).state;
  const tally = useLiveSession(useExerciseTallyStorage());
  const player = useSetsPlayer({
    run,
    store: useLiveRunStore(),
    tally,
    activities: activities.status === "ready" ? activities.data : null,
    exercises: exercises.status === "ready" ? exercises.data : null,
  });
  const { shown, ticked, current, rest, hold, previous, nameOf } = player;
  const finish = useFinishRun(
    run,
    player.finished,
    player.startedAt,
    end,
    exercises.status !== "loading" && activities.status !== "loading"
  );

  const holdRow = (at: SetAt): React.ReactNode =>
    hold.hold?.at === setKey(at) && (
      <HoldRow
        hold={hold.hold}
        now={hold.now}
        lead={<span className="set-col-n">{formatNumber(at.set + 1)}</span>}
        onPause={hold.pause}
        onResume={hold.resume}
        onDone={() => {
          if (hold.hold !== null) player.endHold(hold.hold, heldSeconds(hold.hold, Date.now()));
        }}
      />
    );
  const go = (at: SetAt): React.ReactNode => {
    const targetS = player.holdTarget(at);
    return (
      targetS !== null && (
        <HoldButton name={nameOf(at.item)} targetS={targetS} onPress={() => player.startHold(at)} />
      )
    );
  };
  const restAt = (key: string): React.ReactNode =>
    rest.rest?.at === key && (
      <RestRow rest={rest.rest} left={rest.left} onMore={rest.more} onSkip={rest.skip} />
    );

  return (
    <PlayerFrame
      run={run}
      startedAt={player.startedAt}
      footer={
        <button type="button" className="detail-primary" onClick={finish}>
          {t("activities.finish")}
        </button>
      }
    >
      {run.items.map((item, i) => {
        const d = shown[i];
        if (d === undefined) return null;
        const climbing = player.climbing(i);
        const between =
          restAt(afterKey(i)) ||
          (i < run.items.length - 1 && run.exerciseRestS > 0 && (
            <RestPreview seconds={run.exerciseRestS} />
          ));
        return (
          <React.Fragment key={i}>
            {climbing !== null ? (
              <ClimbingCard
                item={item}
                {...climbing}
                onStart={() => {
                  player.startClimbing(i, climbing.measure);
                  void navigate("/app/workout/tally");
                }}
              />
            ) : player.folded(i) ? (
              <FoldedSetsCard
                name={nameOf(i)}
                sets={item.dose.sets}
                onOpen={() => player.open(i)}
              />
            ) : (
              <SetsCard
                item={item}
                done={d}
                target={(set) => player.target({ item: i, set })}
                previous={previous(d.exercise)}
                lifting={player.lifting(i)}
                ticked={ticked}
                current={current}
                unit={unit}
                onChange={(set, value) => player.change(i, set, value)}
                onToggle={(set) => player.toggle({ item: i, set })}
                holdRow={(set) => holdRow({ item: i, set })}
                go={(set) => go({ item: i, set })}
                restUnder={(set) => restAt(setKey({ item: i, set }))}
              />
            )}
            {climbing === null && between}
          </React.Fragment>
        );
      })}
    </PlayerFrame>
  );
}
