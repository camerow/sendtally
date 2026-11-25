import React from "react";
import { useNavigate } from "react-router";
import { newExercisePath } from "../editor/paths";
import { kindLabel } from "@sendtally/features/activities";
import { exerciseShelves, shelfRows } from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { useExercises } from "@sendtally/features/statistics";
import { useAppApi } from "../../lib/useAppApi";
import { CategoryRow } from "../components/CategoryRow";
import { DashedPanel } from "../components/DashedPanel";
import { ShelfHeader } from "../components/ShelfHeader";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { SHELF_ROWS } from "../library/LibraryShelf";
import { useLibrary } from "../library/useLibrary";
import { joinPath, useLocks } from "../locks";
import { useLockedExercises } from "../useLockedRows";
import { exerciseCategoryPath, sourcePath } from "./paths";

/**
 * Train > Exercises: every category, each exercise with how many workouts use it.
 * Fingers holds the user's own grips and the built-in ones they have hung on.
 */
export function ExerciseShelves(): React.ReactElement {
  const api = useAppApi();
  const navigate = useNavigate();
  const { model } = useHangData();
  const exercises = useExercises(api);
  const library = useLibrary().state;
  const locked = useLockedExercises();
  const create = useLocks().create;
  if (exercises.state.status !== "ready")
    return <LoadState state={exercises.state} onRetry={() => void exercises.reload()} />;
  const shelves = exerciseShelves({
    exercises: exercises.state.data,
    grips: model.grips,
    workouts: library.status === "ready" ? library.data.workouts : [],
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
            add={{
              label: t("workouts.newExerciseIn", { category: kindLabel(kind) }),
              onPress: () => void navigate(create ? joinPath("create") : newExercisePath(kind)),
              locked: create,
            }}
          />
          {entries.length === 0 ? (
            <DashedPanel body={t(`workouts.categoryEmpty.${kind}`)} />
          ) : (
            shelfRows(entries, SHELF_ROWS).map((c) => (
              <CategoryRow
                key={c.key}
                kind={kind}
                name={c.name}
                meta={c.meta ?? t("workouts.notInWorkout")}
                faded={c.meta === null}
                showKind={false}
                picture={c.picture}
                {...locked.row(c, sourcePath(c.source))}
              />
            ))
          )}
        </section>
      ))}
      {locked.sheet}
    </div>
  );
}
