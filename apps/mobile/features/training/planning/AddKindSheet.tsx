import { router } from "expo-router";
import React from "react";
import { usePlan } from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { useLibrary } from "../library/useLibrary";
import { addFlowParams, addKicker, type AddFlow } from "./flowParams";
import { KindSheet } from "./KindSheet";

export type AddKindSheetProps = { flow: AddFlow; visible: boolean; onClose: () => void };

/** What kind to add, asked where the add starts; the add screen opens only once one is picked. */
export function AddKindSheet({ flow, visible, onClose }: AddKindSheetProps): React.ReactElement {
  const { state } = useLibrary();
  const plan = usePlan(useApi()).state;
  const library = state.status === "ready" ? state.data : null;
  return (
    <KindSheet
      visible={visible}
      kicker={addKicker(flow, plan.status === "ready" ? plan.data.blocks : [])}
      count={(k) => library?.workouts.filter((w) => w.kind === k).length ?? 0}
      onPick={(kind) => {
        onClose();
        router.push({ pathname: "/plan/add", params: { ...addFlowParams(flow), kind } });
      }}
      onClose={onClose}
    />
  );
}
