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
  const asked = useLocalSearchParams<{ view?: string; at?: string; highlight?: string }>();
  const wanted: TrainView | null =
    asked.view === "workouts" || asked.view === "plan" ? asked.view : null;
  const request = wanted === null ? null : `${wanted}:${asked.at ?? ""}`;
  const [view, setView] = React.useState<TrainView>(wanted ?? "plan");
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
          { value: "plan", label: t("plan.tabPlan") },
          { value: "workouts", label: t("plan.tabWorkouts") },
        ]}
      />
      {view === "plan" ? (
        <HangDataProvider>
          <PlanOverview key={request ?? ""} highlight={asked.highlight ?? null} />
        </HangDataProvider>
      ) : (
        <WorkoutLibrary />
      )}
    </View>
  );
}
