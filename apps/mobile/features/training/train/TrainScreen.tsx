import { useLocalSearchParams } from "expo-router";
import React from "react";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { Segmented } from "../components/Segmented";
import { HangDataProvider } from "../data/HangDataProvider";
import { WorkoutLibrary } from "../library/WorkoutLibrary";
import { BlocksList } from "./BlocksList";
import { ExerciseShelves } from "./ExerciseShelves";

const VIEWS = ["blocks", "workouts", "exercises"] as const;

type TrainView = (typeof VIEWS)[number];

/** The Train tab: blocks, the workout library, and exercises. */
export function TrainScreen(): React.ReactElement {
  const asked = useLocalSearchParams<{ view?: string; at?: string }>();
  const wanted = VIEWS.find((v) => v === asked.view) ?? null;
  const request = wanted === null ? null : `${wanted}:${asked.at ?? ""}`;
  const [view, setView] = React.useState<TrainView>(wanted ?? "blocks");
  const [seen, setSeen] = React.useState(request);
  if (request !== seen) {
    setSeen(request);
    if (wanted !== null) setView(wanted);
  }
  return (
    <View style={{ gap: 16 }}>
      <Segmented<TrainView>
        value={view}
        onChange={setView}
        options={[
          { value: "blocks", label: t("plan.tabBlocks") },
          { value: "workouts", label: t("plan.tabWorkouts") },
          { value: "exercises", label: t("plan.tabExercises") },
        ]}
      />
      {view === "workouts" ? (
        <WorkoutLibrary />
      ) : (
        <HangDataProvider>
          {view === "blocks" ? <BlocksList /> : <ExerciseShelves />}
        </HangDataProvider>
      )}
    </View>
  );
}
