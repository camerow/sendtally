import { router } from "expo-router";
import React from "react";
import { libraryPictures } from "@sendtally/features/library";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { kindLabel } from "@sendtally/features/activities";
import { pickWith, type BuiltInExercise } from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { workoutsUsing } from "@sendtally/features/statistics";
import { LinkRow } from "../../../components/LinkRow";
import { ScreenFrame } from "../../../components/ScreenFrame";
import { Toast } from "../../../components/Toast";
import { AddToSheet } from "../components/AddToSheet";
import { DashedPanel } from "../components/DashedPanel";
import { Description } from "../components/Description";
import { DetailActions } from "../components/DetailActions";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { CategoryMark } from "../library/CategoryMark";
import { useLibrary } from "../library/useLibrary";
import { lockedRow, useLocks } from "../locks";
import { useAddToWorkout } from "./useAddToWorkout";
import { useExerciseInPlan } from "./useExerciseInPlan";
import { useMakeExercise } from "./useMakeExercise";

export type BuiltInExerciseScreenProps = { builtIn: BuiltInExercise };

/** A built-in the user has not made their own: nothing logged yet, and adding it anywhere makes it theirs. */
export function BuiltInExerciseScreen({ builtIn }: BuiltInExerciseScreenProps): React.ReactElement {
  const pick = pickWith(useMakeExercise());
  const library = useLibrary().state;
  const usedIn =
    library.status === "ready" ? workoutsUsing(library.data.workouts, builtIn.name) : [];
  const addTo = useAddToWorkout({
    name: builtIn.name,
    pick: () => pick({ builtIn }),
    fingers: false,
    usedIn,
  });
  const inPlan = useExerciseInPlan({ kind: builtIn.kind, name: builtIn.name, source: { builtIn } });
  const toast = addTo.toast ?? inPlan.block.toast;
  const locked = useLocks().create;
  const menu = [
    ...[addTo.row, inPlan.block.row]
      .filter((r) => r !== null)
      .map((r) => (locked ? lockedRow(r, "exercise") : r)),
    inPlan.schedule,
  ];
  return (
    <ScreenFrame
      overlay={toast && <Toast {...toast} />}
      action={<DetailActions menu={menu} />}
      hero={libraryPictures("exercise", builtIn.id)}
    >
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <CategoryMark kind={builtIn.kind} size={28} />
          <Label color={colors.textSecondary}>{kindLabel(builtIn.kind)}</Label>
        </View>
        <Title size={38}>{builtIn.name}</Title>
        <Description text={builtIn.description} fold />
      </View>
      <DashedPanel body={t("workouts.exerciseNothingLogged")} />
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
    </ScreenFrame>
  );
}
