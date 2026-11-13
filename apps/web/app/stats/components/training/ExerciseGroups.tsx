import React from "react";
import { Link } from "react-router";
import { kindLabel, useWeightUnit } from "@sendtally/features/activities";
import { canCompareGrips } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  exerciseByKey,
  useExercises,
  type ExerciseGroupKind,
  type ExerciseGroupVM,
} from "@sendtally/features/statistics";
import { KIND_LOOK } from "@sendtally/features/training";
import { Icon } from "../../../components/Icon";
import { useAppApi } from "../../../lib/useAppApi";
import { useHangData } from "../../../training/data/HangDataContext";
import { COMPARE_GRIPS_PATH, exercisePath, gripPath } from "../../../training/exercises/paths";
import { ExerciseTrendRow } from "./ExerciseTrendRow";

/** Every exercise in range, grouped by kind, the most done first; each opens its trend, a grip its own page. */
export function ExerciseGroups({
  groups,
}: {
  groups: ExerciseGroupVM[];
}): React.ReactElement | null {
  const api = useAppApi();
  const unit = useWeightUnit(api);
  const exercises = useExercises(api).state;
  const { model } = useHangData();
  if (groups.length === 0) return null;

  const pathOf = (kind: ExerciseGroupKind, key: string): string | undefined => {
    if (kind === "hangboard") return gripPath(key);
    const exercise = exercises.status === "ready" ? exerciseByKey(exercises.data, key) : undefined;
    return exercise === undefined ? undefined : exercisePath(exercise.id);
  };

  return (
    <section className="stats-card stats-wide">
      <h2 className="stats-label">{t("statistics.exercisesMostDone")}</h2>
      {groups.map((g) => (
        <div key={g.kind}>
          <div className="stats-group-head">
            <span
              className="stats-group-label"
              style={g.kind === "hangboard" ? { color: KIND_LOOK.hangboard.ink } : undefined}
            >
              {kindLabel(g.kind)}
            </span>
            {g.kind === "hangboard" && canCompareGrips(model.sessions) && (
              <Link
                to={COMPARE_GRIPS_PATH}
                className="stats-compare"
                aria-label={t("hang.compareGrips")}
              >
                {t("hang.compare")}
                <Icon name="chevron" size={12} strokeWidth={2.2} />
              </Link>
            )}
          </div>
          {g.rows.map((row) => (
            <ExerciseTrendRow key={row.key} row={row} unit={unit} to={pathOf(g.kind, row.key)} />
          ))}
        </div>
      ))}
    </section>
  );
}
