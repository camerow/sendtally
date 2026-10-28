import { router } from "expo-router";
import React from "react";
import { Alert, View } from "react-native";
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
import { LinkRow } from "../../../components/LinkRow";
import { ScreenFrame } from "../../../components/ScreenFrame";
import { useApi } from "../../../lib/api";
import { DashedPanel } from "../components/DashedPanel";
import { DetailActions } from "../components/DetailActions";
import { deleteRow } from "../components/deleteRow";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { LoadState } from "../data/LoadState";
import { CategoryMark } from "../library/CategoryMark";
import { useLibrary } from "../library/useLibrary";
import { ExerciseTrendCard } from "./ExerciseTrendCard";
import { MergeExerciseSheet } from "./MergeExerciseSheet";
import { RecentSessions } from "./RecentSessions";
import { useMergeExercise } from "./useMergeExercise";

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
    return <LoadState state={exercises.state} onRetry={() => void exercises.reload()} framed />;
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
  const mergeRow = {
    icon: "merge",
    title: t("workouts.mergeExercise"),
    hint: t("workouts.mergeExerciseHint"),
    onPress: () => setMerging(true),
  } as const;
  const remove = deleteRow({
    title: inUse ? t("workouts.archiveExercise") : t("common.delete"),
    hint: inUse ? t("workouts.archiveExerciseBody") : t("workouts.deleteExerciseBody"),
    confirm: {
      title: inUse
        ? t("workouts.archiveExerciseTitle", { name })
        : t("workouts.deleteExerciseTitle", { name }),
      body: inUse ? t("workouts.archiveExerciseBody") : t("workouts.deleteExerciseBody"),
      action: inUse ? t("workouts.archiveExercise") : t("common.delete"),
    },
    onDelete: () => void api.removeExercise(exercise.id).catch(failed),
  });

  return (
    <ScreenFrame
      action={
        <DetailActions
          onEdit={() =>
            router.push({
              pathname: "/exercise/edit",
              params: { id: exercise.id, kind: exercise.kind },
            })
          }
          menu={exercise.archived ? [mergeRow] : [mergeRow, remove]}
        />
      }
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
      {merging && (
        <MergeExerciseSheet
          exercise={exercise}
          others={all.filter((e) => e.id !== exercise.id)}
          onPick={(into) => merge(exercise, into)}
          onClose={() => setMerging(false)}
        />
      )}
    </ScreenFrame>
  );
}
