import { router } from "expo-router";
import React from "react";
import { t } from "@sendtally/features/i18n";
import { Button } from "../components/Button";
import type { AddFlow } from "./flowParams";
import { useAddTo } from "./useAddTo";

export type AddButtonProps = { flow: AddFlow; workoutId: string };

/** A preview's Add, opened from the add sheet: adds it as the sheet's + does, then goes back. */
export function AddButton({ flow, workoutId }: AddButtonProps): React.ReactElement {
  const addTo = useAddTo(flow);
  const there = addTo.plans.some((m) => m.workoutId === workoutId);
  return (
    <Button
      label={there ? (flow.date !== null ? t("plan.onDay") : t("plan.inBlock")) : t("hang.add")}
      onPress={() => {
        addTo.add(workoutId);
        router.back();
      }}
      disabled={there}
      variant="primary"
      height={54}
      icon={there ? undefined : "plus"}
    />
  );
}
