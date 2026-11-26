import { router } from "expo-router";
import React from "react";
import { libraryPictures } from "@sendtally/features/library";
import { Alert, View } from "react-native";
import type { Exercise } from "@sendtally/api-client";
import { colors } from "@sendtally/design/tokens";
import { kindLabel, useWeightUnit } from "@sendtally/features/activities";
import {
  builtInExercise,
  exerciseDescription,
  exerciseLabel,
  useExerciseActions,
} from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { deleteCopy } from "@sendtally/features/training";
import {
  exerciseKey,
  useExerciseSeries,
  useExercises,
  workoutsUsing,
} from "@sendtally/features/statistics";
import { LinkRow } from "../../../components/LinkRow";
import { ScreenFrame } from "../../../components/ScreenFrame";
import { Toast } from "../../../components/Toast";
import { useApi } from "../../../lib/api";
import { AddToSheet } from "../components/AddToSheet";
import { DashedPanel } from "../components/DashedPanel";
import { Description } from "../components/Description";
import { DetailActions } from "../components/DetailActions";
import { deleteRow } from "../components/deleteRow";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { LoadState } from "../data/LoadState";
import { LockedPage } from "../components/LockedPage";
import { useCreateGate, useLocks } from "../locks";
import { pickedOf } from "../exercise-picker/usePick";
import { CategoryMark } from "../library/CategoryMark";
import { useLibrary } from "../library/useLibrary";
import { BuiltInExerciseScreen } from "./BuiltInExerciseScreen";
import { ExerciseTrendCard } from "./ExerciseTrendCard";
import { MergeExerciseSheet } from "./MergeExerciseSheet";
import { ExerciseHistory } from "./ExerciseHistory";
import { useAddToWorkout } from "./useAddToWorkout";
import { useExerciseInPlan } from "./useExerciseInPlan";
import { useMergeExercise } from "./useMergeExercise";

const failed = (): void => Alert.alert(t("workouts.saveFailed"));

export type ExerciseScreenProps = { id: string };

type DetailProps = { exercise: Exercise; all: readonly Exercise[] };

function Detail({ exercise, all }: DetailProps): React.ReactElement {
  const api = useApi();
  const series = useExerciseSeries(api);
  const library = useLibrary().state;
  const unit = useWeightUnit(api);
  const [merging, setMerging] = React.useState(false);
  const merge = useMergeExercise();
  const actions = useExerciseActions(api, failed);
  const name = exerciseLabel(exercise);
  const logged =
    series.status === "ready"
      ? series.data.find((s) => s.key === exerciseKey(exercise.name))
      : undefined;
  const usedIn =
    library.status === "ready" ? workoutsUsing(library.data.workouts, exercise.name) : [];
  const addTo = useAddToWorkout({
    name,
    pick: async () => pickedOf({ exercise }),
    fingers: false,
    usedIn,
  });

  const inPlan = useExerciseInPlan({ kind: exercise.kind, name, source: { exercise } });
  const gate = useCreateGate("exercise");
  const toast = addTo.toast ?? inPlan.block.toast;
  const inUse = usedIn.length > 0 || logged !== undefined;
  const mergeRow = {
    icon: "merge",
    title: t("workouts.mergeExercise"),
    onPress: () => setMerging(true),
  } as const;
  const remove = deleteRow(
    deleteCopy("exercise", name, inUse),
    () => void actions.remove(exercise.id)
  );
  const menu = exercise.archived
    ? [mergeRow]
    : [
        ...[addTo.row, inPlan.block.row].filter((r) => r !== null).map(gate),
        inPlan.schedule,
        mergeRow,
        remove,
      ];

  return (
    <ScreenFrame
      overlay={toast && <Toast {...toast} />}
      hero={libraryPictures("exercise", exercise.builtIn)}
      action={
        <DetailActions
          onEdit={() =>
            router.push({
              pathname: "/exercise/edit",
              params: { id: exercise.id, kind: exercise.kind },
            })
          }
          menu={menu}
        />
      }
    >
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <CategoryMark kind={exercise.kind} size={28} />
          <Label color={colors.textSecondary}>{kindLabel(exercise.kind)}</Label>
        </View>
        <Title size={38}>{name}</Title>
        <Description text={exerciseDescription(exercise)} fold />
      </View>
      {logged === undefined ? (
        <DashedPanel body={t("workouts.exerciseNothingLogged")} />
      ) : (
        unit !== null && (
          <>
            {logged.untracked !== true && (
              <ExerciseTrendCard series={logged} chart="best" unit={unit} />
            )}
            <ExerciseHistory series={logged} unit={unit} />
          </>
        )
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
      {addTo.sheet && <AddToSheet {...addTo.sheet} />}
      {inPlan.block.sheet && <AddToSheet {...inPlan.block.sheet} />}
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

/**
 * One exercise: its best-set trend, its last sessions and the workouts that use it. A built-in id
 * opens the user's own copy once they have one, else the built-in itself.
 */
export function ExerciseScreen({ id }: ExerciseScreenProps): React.ReactElement | null {
  const exercises = useExercises(useApi());
  const locks = useLocks();
  if (exercises.state.status !== "ready")
    return <LoadState state={exercises.state} onRetry={() => void exercises.reload()} framed />;
  const all = exercises.state.data;
  const exercise = all.find((e) => e.id === id || (e.builtIn === id && !e.archived));
  if (exercise !== undefined)
    return locks.exercise({ exercise }) ? (
      <LockedPage source="exercise" />
    ) : (
      <Detail exercise={exercise} all={all} />
    );
  const builtIn = builtInExercise(id);
  return builtIn === undefined ? null : <BuiltInExerciseScreen builtIn={builtIn} />;
}
