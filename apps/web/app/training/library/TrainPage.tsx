import React from "react";
import { useSearchParams } from "react-router";
import { Logo } from "@sendtally/design";
import { t } from "@sendtally/features/i18n";
import { AccountButton } from "../../components/AccountButton";
import { Segmented } from "../../components/Segmented";
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
  return (
    <div className="train">
      <div className="train-head">
        <span className="train-head-mark">
          <Logo variant="mark" size={22} />
        </span>
        <h1 className="train-head-title">{t("training.train")}</h1>
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
    </div>
  );
}
