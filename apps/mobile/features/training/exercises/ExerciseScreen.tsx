import { router } from "expo-router";
import React from "react";
import { Alert, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Exercise } from "@sendtally/api-client";
import { colors } from "@sendtally/design/tokens";
import { kindLabel, useWeightUnit } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import {
  exerciseKey,
  useExerciseSeries,
  useExercises,
  workoutsUsing,
} from "@sendtally/features/statistics";
import { BackButton } from "../../../components/BackButton";
import { LinkRow } from "../../../components/LinkRow";
import { useApi } from "../../../lib/api";
import { DashedPanel } from "../components/DashedPanel";
import { IconButton } from "../components/IconButton";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { LoadState } from "../data/LoadState";
import { CategoryMark } from "../library/CategoryMark";
import { useLibrary } from "../library/useLibrary";
import { ExerciseTrendCard } from "./ExerciseTrendCard";
import { MergeExerciseSheet } from "./MergeExerciseSheet";
import { RecentSessions } from "./RecentSessions";
import { RenameExerciseSheet } from "./RenameExerciseSheet";
import { takenBy } from "./takenBy";

const failed = (): void => Alert.alert(t("workouts.saveFailed"));

export type ExerciseScreenProps = { id: string };

/** One exercise: its best-set trend, its last sessions and the workouts that use it. */
export function ExerciseScreen({ id }: ExerciseScreenProps): React.ReactElement | null {
  const api = useApi();
  const exercises = useExercises(api);
  const series = useExerciseSeries(api);
  const library = useLibrary().state;
  const unit = useWeightUnit(api);
  const [sheet, setSheet] = React.useState<"rename" | "merge" | null>(null);
  if (exercises.state.status !== "ready")
    return <LoadState state={exercises.state} onRetry={() => void exercises.reload()} />;
  const all = exercises.state.data;
  const exercise = all.find((e) => e.id === id);
  if (exercise === undefined) return null;
  const logged =
    series.status === "ready"
      ? series.data.find((s) => s.key === exerciseKey(exercise.name))
      : undefined;
  const usedIn =
    library.status === "ready" ? workoutsUsing(library.data.workouts, exercise.name) : [];

  const merge = (into: Exercise): void =>
    Alert.alert(
      t("workouts.mergeExerciseTitle", { from: exercise.name, into: into.name }),
      t("workouts.mergeExerciseBody", { from: exercise.name, into: into.name }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("workouts.merge"),
          onPress: () =>
            void api
              .mergeExercise(exercise.id, into.id)
              .then(
                () => router.replace({ pathname: "/exercise/[id]", params: { id: into.id } }),
                failed
              ),
        },
      ]
    );
  const rename = (name: string): void =>
    void api.saveExercise(exercise.id, { name, kind: exercise.kind }).catch((error: unknown) => {
      const taken = takenBy(error);
      if (taken === undefined) failed();
      else merge(taken);
    });
  const more = (): void =>
    Alert.alert(exercise.name, undefined, [
      { text: t("workouts.renameExercise"), onPress: () => setSheet("rename") },
      { text: t("workouts.mergeExercise"), onPress: () => setSheet("merge") },
      { text: t("common.cancel"), style: "cancel" },
    ]);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.white }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 18,
          paddingTop: 6,
        }}
      >
        <BackButton />
        <IconButton
          icon="more"
          label={t("workouts.exerciseMore")}
          onPress={more}
          color={colors.gunmetal}
          iconSize={22}
        />
      </View>
      <ScrollView
        contentContainerStyle={{ gap: 18, paddingTop: 8, paddingHorizontal: 18, paddingBottom: 24 }}
      >
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <CategoryMark kind={exercise.kind} size={28} />
            <Label color={colors.textSecondary}>{kindLabel(exercise.kind)}</Label>
          </View>
          <Title size={38}>{exercise.name}</Title>
        </View>
        {logged === undefined ? (
          <DashedPanel body={t("workouts.exerciseNothingLogged")} />
        ) : (
          <>
            <ExerciseTrendCard series={logged} chart="best" unit={unit} />
            <RecentSessions sessions={logged.sessions} unit={unit} />
          </>
        )}
        {usedIn.length > 0 && (
          <View style={{ gap: 4 }}>
            <Label color={colors.gunmetal}>{t("workouts.usedIn")}</Label>
            {usedIn.map((w) => (
              <LinkRow
                key={w.id}
                label={w.name}
                onPress={() => router.push({ pathname: "/workout/[id]", params: { id: w.id } })}
              />
            ))}
          </View>
        )}
      </ScrollView>
      {sheet === "rename" && (
        <RenameExerciseSheet exercise={exercise} onSave={rename} onClose={() => setSheet(null)} />
      )}
      {sheet === "merge" && (
        <MergeExerciseSheet
          exercise={exercise}
          others={all.filter((e) => e.id !== exercise.id)}
          onPick={merge}
          onClose={() => setSheet(null)}
        />
      )}
    </SafeAreaView>
  );
}
