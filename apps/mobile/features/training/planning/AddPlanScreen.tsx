import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import type { WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { usePlan } from "@sendtally/features/training";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { LoadState } from "../data/LoadState";
import { LibraryBrowser } from "../library/LibraryBrowser";
import { useLibrary } from "../library/useLibrary";
import { addFlowParams, addKicker, type AddFlow } from "./flowParams";
import { KindSheet } from "./KindSheet";
import { ScreenFrame } from "../../../components/ScreenFrame";

export type AddPlanScreenProps = { flow: AddFlow; initialKind?: WorkoutKind | null };

/**
 * Adding to the plan: what kind in the one sheet, then the library of that kind in one
 * searchable list, the user's own first, to preview one or make a new one.
 */
export function AddPlanScreen({
  flow,
  initialKind = null,
}: AddPlanScreenProps): React.ReactElement {
  const { state, reload } = useLibrary();
  const plan = usePlan(useApi()).state;
  const [kind, setKind] = React.useState<WorkoutKind | null>(initialKind);
  const [choosing, setChoosing] = React.useState(initialKind === null);

  React.useEffect(() => {
    if (!choosing && kind === null) router.back();
  }, [choosing, kind]);

  const kicker = addKicker(flow, plan.status === "ready" ? plan.data.blocks : []);
  const library = state.status === "ready" ? state.data : null;
  const preview = (w: LibraryWorkout): void =>
    router.push({
      pathname: "/workout/preview",
      params: { id: w.id, add: "1", ...addFlowParams(flow) },
    });

  return (
    <ScreenFrame
      action={
        kind !== null && (
          <Button
            label={t("plan.changeType")}
            onPress={() => setChoosing(true)}
            variant="link"
            height={44}
          />
        )
      }
    >
      {kind !== null && (
        <View style={{ gap: 4 }}>
          <Label color={colors.gunmetal}>{kicker}</Label>
          <Title size={34}>{kindLabel(kind)}</Title>
        </View>
      )}
      {kind !== null && (
        <Button
          label={t("workouts.newWorkout")}
          onPress={() => router.push({ pathname: "/workout/edit", params: { kind } })}
          variant="dashed"
          icon="plus"
          height={50}
        />
      )}
      {state.status !== "ready" && <LoadState state={state} onRetry={() => void reload()} />}
      {library !== null && kind !== null && (
        <LibraryBrowser key={kind} library={library} kinds={[kind]} onPick={preview} />
      )}
      <KindSheet
        visible={choosing}
        kicker={kicker}
        count={(k) => library?.workouts.filter((w) => w.kind === k).length ?? 0}
        onPick={(k) => {
          setKind(k);
          setChoosing(false);
        }}
        onClose={() => setChoosing(false)}
      />
    </ScreenFrame>
  );
}
