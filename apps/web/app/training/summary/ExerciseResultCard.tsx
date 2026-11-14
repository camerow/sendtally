import React from "react";
import type { SetClimb, WeightUnit } from "@sendtally/core/hang";
import {
  changeText,
  climbsLine,
  isClimbingSets,
  setChip,
  setText,
  wallLine,
  type ExerciseResult,
} from "@sendtally/features/activities";
import { CIRCUIT_COLOURS, CIRCUIT_HEX } from "@sendtally/features/gyms";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";

/** One climb of a set: its grade, or its circuit's colour, dashed when it did not go. */
function ClimbBadge({ climb }: { climb: SetClimb }): React.ReactElement {
  const colour = CIRCUIT_COLOURS.find((c) => c === climb.circuit?.colour);
  return (
    <span
      role="img"
      aria-label={[
        climb.circuit?.label ?? climb.grade,
        climb.sent ? t("common.sent") : t("sessionDetail.notYet"),
      ].join(", ")}
      className={climb.sent ? "climb-badge" : "climb-badge climb-badge--open"}
    >
      {colour === undefined ? (
        climb.grade
      ) : (
        <span className="climb-badge-dot" style={{ background: CIRCUIT_HEX[colour] }} />
      )}
    </span>
  );
}

/**
 * One exercise as done: its sets with the best one dark, and how it moved since last time.
 * Climbs read as a row of grades per set; time on the wall as time and laps per set.
 */
export function ExerciseResultCard({
  result,
  unit,
}: {
  result: ExerciseResult;
  unit: WeightUnit;
}): React.ReactElement {
  const { change, last } = result;
  const climbing = isClimbingSets(result.sets);
  const wall = climbing && result.sets.some((s) => s.onS !== undefined);
  const chips = result.sets
    .map((set, i) => ({ i, text: setChip(set, unit) }))
    .filter((c) => c.text !== "");
  const footer = wall
    ? wallLine(result.sets)
    : climbing
      ? climbsLine(result.sets)
      : last === null
        ? null
        : t("summary.lastTime", { set: setText(last.set, unit), date: shortDate(last.date) });
  return (
    <div className="result-card">
      <div className="result-card-head">
        <span className="result-card-name">{result.exercise}</span>
        {change !== null && (
          <span className={change.by === 0 ? "result-change" : "result-change result-change--up"}>
            {changeText(change, unit)}
          </span>
        )}
      </div>
      {climbing && !wall
        ? result.sets.map((set, i) => (
            <div key={i} className="climb-set">
              <span className="train-label train-label--small climb-set-label">
                {t("tally.setLabel", { set: i + 1 })}
              </span>
              <span className="climb-set-badges">
                {(set.climbs ?? []).map((climb, c) => (
                  <ClimbBadge key={c} climb={climb} />
                ))}
              </span>
            </div>
          ))
        : chips.length > 0 && (
            <div className="set-chips">
              {chips.map(({ i, text }) => (
                <span
                  key={i}
                  className={i === result.best ? "set-chip set-chip--best" : "set-chip"}
                >
                  {text}
                </span>
              ))}
            </div>
          )}
      {footer !== null && <span className="result-card-foot">{footer}</span>}
    </div>
  );
}
