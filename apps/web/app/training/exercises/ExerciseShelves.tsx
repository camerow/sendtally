import React from "react";
import { kindLabel, useWeightUnit } from "@sendtally/features/activities";
import { exerciseShelves, shelfRows, type ShelfCard } from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { useExerciseSeries, useExercises } from "@sendtally/features/statistics";
import { useAppApi } from "../../lib/useAppApi";
import { CategoryRow } from "../components/CategoryRow";
import { DashedPanel } from "../components/DashedPanel";
import { ShelfHeader } from "../components/ShelfHeader";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { SHELF_ROWS } from "../library/LibraryShelf";
import { useLibrary } from "../library/useLibrary";
import { exerciseCategoryPath, exercisePath, gripPath } from "./paths";

const pathOf = ({ opens }: ShelfCard): string =>
  "grip" in opens ? gripPath(opens.grip) : exercisePath(opens.exercise);

/**
 * Train > Exercises: every category, each exercise with its best result or its last dose.
 * Fingers holds the user's own grips and the built-in ones they have hung on.
 */
export function ExerciseShelves(): React.ReactElement {
  const api = useAppApi();
  const { model, today } = useHangData();
  const exercises = useExercises(api);
  const series = useExerciseSeries(api);
  const library = useLibrary().state;
  const unit = useWeightUnit(api);
  if (exercises.state.status !== "ready")
    return <LoadState state={exercises.state} onRetry={() => void exercises.reload()} />;
  const shelves = exerciseShelves({
    exercises: exercises.state.data,
    grips: model.grips,
    sessions: model.sessions,
    series: series.status === "ready" ? series.data : [],
    workouts: library.status === "ready" ? library.data.workouts : [],
    today,
    unit,
  });
  return (
    <div className="library-shelves">
      {shelves.map(({ kind, entries }) => (
        <section key={kind} className="library-shelf">
          <ShelfHeader
            title={kindLabel(kind)}
            kind={kind}
            seeAll={
              entries.length > SHELF_ROWS
                ? { to: exerciseCategoryPath(kind), count: entries.length }
                : undefined
            }
          />
          {entries.length === 0 ? (
            <DashedPanel body={t(`workouts.categoryEmpty.${kind}`)} />
          ) : (
            shelfRows(entries, SHELF_ROWS).map((c) => (
              <CategoryRow
                key={c.key}
                kind={kind}
                name={c.name}
                meta={c.meta ?? t("workouts.notDoneYet")}
                faded={c.meta === null}
                showKind={false}
                showMark={false}
                to={pathOf(c)}
              />
            ))
          )}
        </section>
      ))}
    </div>
  );
}
