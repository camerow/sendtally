import React from "react";
import { Link, useNavigate } from "react-router";
import { Icon } from "../../components/Icon";
import { newExercisePath } from "../editor/paths";
import { kindLabel } from "@sendtally/features/activities";
import { exerciseShelves, shelfRows, type ShelfCard } from "@sendtally/features/exercises";
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
import { exerciseCategoryPath, exercisePath, gripPath } from "./paths";

const pathOf = ({ opens }: ShelfCard): string =>
  "grip" in opens
    ? gripPath(opens.grip)
    : exercisePath("exercise" in opens ? opens.exercise : opens.builtIn);

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
            add={{
              label: t("workouts.newExerciseIn", { category: kindLabel(kind) }),
              onPress: () => void navigate(newExercisePath(kind)),
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
                showMark={false}
                to={pathOf(c)}
              />
            ))
          )}
          {entries.length > SHELF_ROWS && (
            <Link to={exerciseCategoryPath(kind)} className="link-row">
              {t("workouts.allExercises", { n: entries.length })}
              <Icon name="chevron" size={18} />
            </Link>
          )}
        </section>
      ))}
    </div>
  );
}
