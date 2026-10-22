import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import type { WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { kindLabel } from "@sendtally/features/activities";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { usePlan } from "@sendtally/features/training";
import { browseLibrary, type LibraryWorkout } from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { LoadState } from "../data/LoadState";
import { LibraryCard } from "../library/LibraryCard";
import { useLibrary } from "../library/useLibrary";
import { addFlowParams, type AddFlow } from "./flowParams";
import { KindSheet } from "./KindSheet";
import { ScreenFrame } from "./ScreenFrame";

export type AddPlanScreenProps = { flow: AddFlow };

/**
 * Adding to the plan: what kind in the one sheet, then the library of that kind, the
 * user's own first, to preview one or make a new one.
 */
export function AddPlanScreen({ flow }: AddPlanScreenProps): React.ReactElement {
  const { state, reload } = useLibrary();
  const plan = usePlan(useApi()).state;
  const [kind, setKind] = React.useState<WorkoutKind | null>(null);
  const [choosing, setChoosing] = React.useState(true);

  React.useEffect(() => {
    if (!choosing && kind === null) router.back();
  }, [choosing, kind]);

  const block =
    plan.status === "ready" && flow.blockId !== null
      ? plan.data.blocks.find((b) => b.id === flow.blockId)
      : undefined;
  const kicker =
    block !== undefined
      ? t("plan.addToBlock", { name: block.name })
      : flow.date !== null
        ? t("plan.forDate", { date: shortDate(flow.date) })
        : t("plan.addToPlan");
  const library = state.status === "ready" ? state.data : null;
  const shelves =
    library === null || kind === null
      ? null
      : browseLibrary(library.workouts, { text: "", kinds: [kind] }, library.usage);
  const preview = (w: LibraryWorkout): void =>
    router.push({
      pathname: "/workout/preview",
      params: { id: w.id, add: "1", ...addFlowParams(flow) },
    });
  const shelf = (label: string, workouts: readonly LibraryWorkout[]): React.ReactNode =>
    workouts.length > 0 && (
      <View style={{ gap: 10 }}>
        <Label color={colors.textSecondary}>{label}</Label>
        {workouts.map((w) => (
          <LibraryCard
            key={w.id}
            workout={w}
            use={library?.usage.get(w.id)}
            onPress={() => preview(w)}
          />
        ))}
      </View>
    );

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
          <Label color={colors.labelAccent}>{kicker}</Label>
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
      {shelves !== null && shelf(t("workouts.mine"), shelves.mine)}
      {shelves !== null &&
        shelf(t("workouts.builtInCount", { n: shelves.builtIn.length }), shelves.builtIn)}
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
