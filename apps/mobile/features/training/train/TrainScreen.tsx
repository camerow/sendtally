import { router } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { Fab } from "../../../components/Fab";
import type { IconName } from "../../../components/Icon";
import { Sheet } from "../../../components/Sheet";
import { MenuRow } from "../../live-session/MenuRow";
import { Segmented } from "../components/Segmented";
import { HangDataProvider } from "../data/HangDataProvider";
import { NewExerciseSheet } from "../exercises/NewExerciseSheet";
import { NewWorkoutSheet } from "../library/NewWorkoutSheet";
import { WorkoutLibrary } from "../library/WorkoutLibrary";
import { BlocksList } from "./BlocksList";
import { ExerciseShelves } from "./ExerciseShelves";

type TrainView = "blocks" | "workouts" | "exercises";

const VIEWS: readonly TrainView[] = ["blocks", "workouts", "exercises"];

const icon: Record<TrainView, IconName> = {
  blocks: "today",
  workouts: "train",
  exercises: "pencil",
};

const label = (v: TrainView): string =>
  v === "blocks"
    ? t("plan.newBlock")
    : v === "workouts"
      ? t("workouts.newWorkout")
      : t("workouts.newExercise");

const hint = (v: TrainView): string =>
  v === "blocks"
    ? t("plan.newBlockHint")
    : v === "workouts"
      ? t("workouts.newWorkoutHint")
      : t("workouts.newExerciseHint");

/** The Train tab: blocks, the workout library, and exercises; New makes the one in view, its menu any of them. */
export function TrainScreen(): React.ReactElement {
  const [view, setView] = React.useState<TrainView>("blocks");
  const [adding, setAdding] = React.useState<TrainView | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const picked = React.useRef<TrainView | null>(null);
  const create = (v: TrainView): void => {
    if (v === "blocks") router.push("/plan/block/new");
    else setAdding(v);
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
      <Fab
        label={label(view)}
        onPress={() => create(view)}
        menu={{ label: t("plan.createMenu"), onPress: () => setMenuOpen(true) }}
      />
      <Sheet
        visible={menuOpen}
        onClose={() => {
          setMenuOpen(false);
          if (picked.current !== null) create(picked.current);
          picked.current = null;
        }}
        closeLabel={t("common.cancel")}
      >
        <View style={{ gap: 4, paddingTop: 4, paddingHorizontal: 12, paddingBottom: 4 }}>
          {VIEWS.map((v) => (
            <MenuRow
              key={v}
              icon={icon[v]}
              title={label(v)}
              hint={hint(v)}
              onPress={() => {
                picked.current = v;
                setMenuOpen(false);
              }}
            />
          ))}
        </View>
      </Sheet>
      {adding === "workouts" && <NewWorkoutSheet onClose={() => setAdding(null)} />}
      {adding === "exercises" && <NewExerciseSheet onClose={() => setAdding(null)} />}
    </View>
  );
}
