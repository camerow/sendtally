import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { Button } from "../components/Button";
import { DashedPanel } from "../components/DashedPanel";
import { Segmented } from "../components/Segmented";
import { useHangData } from "../data/HangDataContext";
import { HangDataProvider } from "../data/HangDataProvider";
import { WorkoutCard } from "./WorkoutCard";

type Source = "library" | "mine";

function Library(): React.ReactElement {
  const { model } = useHangData();
  const [source, setSource] = React.useState<Source>("library");
  const mine = model.workouts.filter((w) => w.source === "mine");
  const shown = model.workouts.filter((w) => w.source === source);

  return (
    <View style={{ gap: 14 }}>
      <Segmented<Source>
        value={source}
        onChange={setSource}
        options={[
          { value: "library", label: t("hang.library") },
          { value: "mine", label: t("hang.myWorkouts", { n: mine.length }) },
        ]}
      />
      {source === "mine" && shown.length === 0 && <DashedPanel body={t("hang.noMine")} />}
      {shown.map((w) => (
        <WorkoutCard
          key={w.id}
          workout={w}
          onPress={() => router.push({ pathname: "/workout/[id]", params: { id: w.id } })}
        />
      ))}
      {source === "mine" && (
        <Button
          label={t("hang.newWorkout")}
          onPress={() => router.push("/workout/builder")}
          variant="dashed"
          icon="plus"
          height={50}
        />
      )}
    </View>
  );
}

/**
 * The hangboard workouts, Library | My workouts, as cards that open a workout. It lays out
 * as a plain column for the host screen's own scroll view and loads its own data.
 */
export function WorkoutLibrary(): React.ReactElement {
  return (
    <HangDataProvider>
      <Library />
    </HangDataProvider>
  );
}
