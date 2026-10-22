import { useLocalSearchParams } from "expo-router";
import React from "react";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { Segmented } from "../components/Segmented";
import { HangDataProvider } from "../data/HangDataProvider";
import { WorkoutLibrary } from "../library/WorkoutLibrary";
import { PlanOverview } from "../plan/PlanOverview";

type TrainView = "plan" | "workouts";

/** The Train tab: your plan, or the workout library. */
export function TrainScreen(): React.ReactElement {
  const asked = useLocalSearchParams<{ view?: string; at?: string }>();
  const request = asked.view === "workouts" ? `${asked.view}:${asked.at ?? ""}` : null;
  const [view, setView] = React.useState<TrainView>(request === null ? "plan" : "workouts");
  const [seen, setSeen] = React.useState(request);
  if (request !== seen) {
    setSeen(request);
    if (request !== null) setView("workouts");
  }
  return (
    <View style={{ gap: 16 }}>
      <Segmented<TrainView>
        value={view}
        onChange={setView}
        options={[
          { value: "plan", label: t("plan.tabPlan") },
          { value: "workouts", label: t("plan.tabWorkouts") },
        ]}
      />
      {view === "plan" ? (
        <HangDataProvider>
          <PlanOverview />
        </HangDataProvider>
      ) : (
        <WorkoutLibrary />
      )}
    </View>
  );
}
