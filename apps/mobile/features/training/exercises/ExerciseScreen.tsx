import { router } from "expo-router";
import React from "react";
import { Alert, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import { kindLabel, useWeightUnit } from "@sendtally/features/activities";
import { exerciseLabel } from "@sendtally/features/exercises";
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
import { useMergeExercise } from "./useMergeExercise";
import { confirmDestructive } from "../../../lib/confirmDestructive";

const failed = (): void => Alert.alert(t("workouts.saveFailed"));

export type ExerciseScreenProps = { id: string };

/** One exercise: its best-set trend, its last sessions and the workouts that use it. */
export function ExerciseScreen({ id }: ExerciseScreenProps): React.ReactElement | null {
  const api = useApi();
  const exercises = useExercises(api);
  const series = useExerciseSeries(api);
  const library = useLibrary().state;
  const unit = useWeightUnit(api);
  const [merging, setMerging] = React.useState(false);
  const merge = useMergeExercise();
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

  const inUse = usedIn.length > 0 || logged !== undefined;
  const name = exerciseLabel(exercise);
  const remove = (): void =>
    confirmDestructive({
      title: inUse
        ? t("workouts.archiveExerciseTitle", { name })
        : t("workouts.deleteExerciseTitle", { name }),
      body: inUse ? t("workouts.archiveExerciseBody") : t("workouts.deleteExerciseBody"),
      action: inUse ? t("workouts.archiveExercise") : t("common.delete"),
      onConfirm: () => {
        router.back();
        void api.removeExercise(exercise.id).catch(failed);
      },
    });
  const more = (): void =>
    Alert.alert(name, undefined, [
      {
        text: t("common.edit"),
        onPress: () =>
          router.push({
            pathname: "/exercise/edit",
            params: { id: exercise.id, kind: exercise.kind },
          }),
      },
      { text: t("workouts.mergeExercise"), onPress: () => setMerging(true) },
      ...(exercise.archived
        ? []
        : [
            {
              text: inUse ? t("workouts.archiveExercise") : t("common.delete"),
              style: "destructive" as const,
              onPress: remove,
            },
          ]),
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
          <Title size={38}>{name}</Title>
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
      {merging && (
        <MergeExerciseSheet
          exercise={exercise}
          others={all.filter((e) => e.id !== exercise.id)}
          onPick={(into) => merge(exercise, into)}
          onClose={() => setMerging(false)}
        />
      )}
    </SafeAreaView>
  );
}
