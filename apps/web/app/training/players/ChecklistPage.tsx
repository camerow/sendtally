import React from "react";
import { useWeightUnit } from "@sendtally/features/activities";
import { eachSideOf } from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { useExercises } from "@sendtally/features/statistics";
import {
  afterKey,
  doseSummary,
  exerciseName,
  heldSeconds,
  useChecklistPlayer,
  type WorkoutRun,
} from "@sendtally/features/workouts";
import { useAppApi } from "../../lib/useAppApi";
import { useLiveRunStore } from "../../lib/useLiveRun";
import { ChecklistRow } from "./ChecklistRow";
import { HoldButton } from "./HoldButton";
import { HoldRow } from "./HoldRow";
import { PlayerFrame } from "./PlayerFrame";
import { RestPreview } from "./RestPreview";
import { RestRow } from "./RestRow";
import { useFinishRun } from "./useFinishRun";

/**
 * A routine to tick off line by line on a clock from Start, resting between lines; whatever is
 * ticked is what gets logged, and the form can still tick the rest.
 */
export function ChecklistPage({ run, end }: { run: WorkoutRun; end: boolean }): React.ReactElement {
  const api = useAppApi();
  const unit = useWeightUnit(api);
  const exercises = useExercises(api).state;
  const sided = eachSideOf(exercises.status === "ready" ? exercises.data : []);
  const player = useChecklistPlayer(run, useLiveRunStore(), sided);
  const { ticked, rest, hold } = player;
  const finish = useFinishRun(run, player.finished, player.startedAt, end, true);

  return (
    <PlayerFrame
      run={run}
      startedAt={player.startedAt}
      footer={
        <div className="player-finish">
          <button type="button" className="detail-primary" onClick={finish}>
            {t("activities.doneForToday")}
          </button>
          <span className="player-finish-note">{t("activities.partialCounts")}</span>
        </div>
      }
    >
      <div className="check-list">
        {run.items.map((item, i) => {
          const name = exerciseName(item.exercise);
          const targetS = player.holdTarget(i);
          return (
            <React.Fragment key={i}>
              {hold.hold?.at === String(i) ? (
                <div className="check-hold">
                  <span className="check-row-name">{name}</span>
                  <HoldRow
                    hold={hold.hold}
                    now={hold.now}
                    onPause={hold.pause}
                    onResume={hold.resume}
                    onDone={() => {
                      if (hold.hold !== null)
                        player.endHold(hold.hold, heldSeconds(hold.hold, Date.now()));
                    }}
                  />
                </div>
              ) : (
                <ChecklistRow
                  name={name}
                  dose={doseSummary(run.kind, item.dose, unit, sided(item.exercise))}
                  ticked={ticked.has(i)}
                  onToggle={() => player.toggle(i)}
                  go={
                    targetS !== null && (
                      <HoldButton
                        name={name}
                        targetS={targetS}
                        onPress={() => player.startHold(i)}
                      />
                    )
                  }
                />
              )}
              {rest.rest?.at === afterKey(i) ? (
                <RestRow rest={rest.rest} left={rest.left} onMore={rest.more} onSkip={rest.skip} />
              ) : (
                i < run.items.length - 1 &&
                run.exerciseRestS > 0 && <RestPreview seconds={run.exerciseRestS} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </PlayerFrame>
  );
}
