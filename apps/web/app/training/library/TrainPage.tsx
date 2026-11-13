import React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Logo } from "@sendtally/design";
import { t } from "@sendtally/features/i18n";
import { AccountButton } from "../../components/AccountButton";
import { PageAction } from "../../components/PageAction";
import { Segmented } from "../../components/Segmented";
import { CategorySheet } from "../editor/CategorySheet";
import { newExercisePath, newWorkoutPath } from "../editor/paths";
import { HangDataProvider } from "../data/HangDataProvider";
import { ExerciseShelves } from "../exercises/ExerciseShelves";
import { WorkoutLibrary } from "./WorkoutLibrary";

type TrainView = "workouts" | "exercises";

const readView = (param: string | null): TrainView =>
  param === "exercises" ? "exercises" : "workouts";

/** The Train tab: the workout library and the exercises, until blocks join them. */
export function TrainPage(): React.ReactElement {
  const [params, setParams] = useSearchParams();
  const view = readView(params.get("view"));
  const navigate = useNavigate();
  const [making, setMaking] = React.useState<"workout" | "exercise" | null>(null);
  return (
    <div className="train">
      <div className="train-head">
        <span className="train-head-mark">
          <Logo variant="mark" size={22} />
        </span>
        <h1 className="train-head-title">{t("training.train")}</h1>
        <PageAction
          label={t("plan.create")}
          items={[
            { label: t("workouts.createWorkout"), onSelect: () => setMaking("workout") },
            { label: t("workouts.createExercise"), onSelect: () => setMaking("exercise") },
          ]}
        />
        <AccountButton />
      </div>
      <Segmented<TrainView>
        label={t("training.train")}
        value={view}
        onChange={(v) => setParams(v === "workouts" ? {} : { view: v }, { replace: true })}
        options={[
          { value: "workouts", label: t("plan.tabWorkouts") },
          { value: "exercises", label: t("plan.tabExercises") },
        ]}
      />
      <HangDataProvider>
        {view === "workouts" ? <WorkoutLibrary /> : <ExerciseShelves />}
      </HangDataProvider>
      {making !== null && (
        <CategorySheet
          making={making}
          onPick={(kind) =>
            void navigate(making === "workout" ? newWorkoutPath(kind) : newExercisePath(kind))
          }
          onClose={() => setMaking(null)}
        />
      )}
    </div>
  );
}
