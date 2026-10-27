import { router } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { Fab, type FabProps } from "../../../components/Fab";
import { Segmented } from "../components/Segmented";
import { HangDataProvider } from "../data/HangDataProvider";
import { NewExerciseSheet } from "../exercises/NewExerciseSheet";
import { NewWorkoutSheet } from "../library/NewWorkoutSheet";
import { WorkoutLibrary } from "../library/WorkoutLibrary";
import { BlocksList } from "./BlocksList";
import { ExerciseShelves } from "./ExerciseShelves";

type TrainView = "blocks" | "workouts" | "exercises";

/** The Train tab: blocks, the workout library, and exercises, each with its own New button. */
export function TrainScreen(): React.ReactElement {
  const [view, setView] = React.useState<TrainView>("blocks");
  const [adding, setAdding] = React.useState<TrainView | null>(null);
  const fab: Record<TrainView, FabProps> = {
    blocks: { label: t("plan.newBlock"), onPress: () => router.push("/plan/block/new") },
    workouts: { label: t("workouts.newWorkout"), onPress: () => setAdding("workouts") },
    exercises: { label: t("workouts.newExercise"), onPress: () => setAdding("exercises") },
  };
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ gap: 16, paddingHorizontal: 18, paddingTop: 4, paddingBottom: 96 }}
      >
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
      </ScrollView>
      <Fab {...fab[view]} />
      {adding === "workouts" && <NewWorkoutSheet onClose={() => setAdding(null)} />}
      {adding === "exercises" && <NewExerciseSheet onClose={() => setAdding(null)} />}
    </View>
  );
}
