import { router } from "expo-router";
import React from "react";
import { useSharedValue } from "react-native-reanimated";
import { ScrollView, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { Fab } from "../../../components/Fab";
import type { IconName } from "../../../components/Icon";
import { Sheet } from "../../../components/Sheet";
import { MenuRow } from "../../live-session/MenuRow";
import { Segmented } from "../components/Segmented";
import { SegmentPager } from "../../../components/SegmentPager";
import { HangDataProvider } from "../data/HangDataProvider";
import { openExerciseEditor } from "../exercises/openExerciseEditor";
import { NewWorkoutSheet } from "../library/NewWorkoutSheet";
import { WorkoutLibrary } from "../library/WorkoutLibrary";
import { useNewBlock } from "../planning/useNewBlock";
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
    ? t("plan.createBlock")
    : v === "workouts"
      ? t("workouts.createWorkout")
      : t("workouts.createExercise");

/**
 * The Train tab: blocks, the workout library, and exercises. Create opens a sheet to make any
 * of them; a workout or an exercise asks its category first.
 */
export function TrainScreen(): React.ReactElement {
  const [view, setView] = React.useState<TrainView>("blocks");
  const [adding, setAdding] = React.useState<"workout" | "exercise" | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const picked = React.useRef<TrainView | null>(null);
  const newBlock = useNewBlock(t("training.train"));
  const create = (v: TrainView): void => {
    if (v === "blocks") newBlock();
    else setAdding(v === "workouts" ? "workout" : "exercise");
  };
  const views = [
    { value: "blocks" as const, label: t("plan.tabBlocks") },
    { value: "workouts" as const, label: t("plan.tabWorkouts") },
    { value: "exercises" as const, label: t("plan.tabExercises") },
  ];
  const progress = useSharedValue(VIEWS.indexOf(view));
  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 18, paddingTop: 4, paddingBottom: 16 }}>
        <Segmented<TrainView> value={view} onChange={setView} options={views} progress={progress} />
      </View>
      <SegmentPager
        options={views}
        value={view}
        onChange={setView}
        progress={progress}
        renderPage={(page) => (
          <ScrollView contentContainerStyle={{ gap: 16, paddingHorizontal: 18, paddingBottom: 96 }}>
            {page === "workouts" ? (
              <WorkoutLibrary />
            ) : (
              <HangDataProvider>
                {page === "blocks" ? <BlocksList /> : <ExerciseShelves />}
              </HangDataProvider>
            )}
          </ScrollView>
        )}
      />
      <Fab label={t("plan.create")} onPress={() => setMenuOpen(true)} />
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
              onPress={() => {
                picked.current = v;
                setMenuOpen(false);
              }}
            />
          ))}
        </View>
      </Sheet>
      {adding !== null && (
        <NewWorkoutSheet
          making={adding}
          onPick={(kind) =>
            adding === "workout"
              ? router.push({ pathname: "/workout/edit", params: { kind } })
              : openExerciseEditor(kind)
          }
          onClose={() => setAdding(null)}
        />
      )}
    </View>
  );
}
