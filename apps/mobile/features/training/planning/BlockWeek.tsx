import React from "react";
import { View } from "react-native";
import type { Block, Membership } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import type { WorkoutLookup } from "@sendtally/features/training";
import { Button } from "../components/Button";
import { DashedPanel } from "../components/DashedPanel";
import { useHangData } from "../data/HangDataContext";
import { PlanGrid } from "../plan/PlanGrid";
import { planGridRows } from "../plan/planGridRows";
import { AddKindSheet } from "./AddKindSheet";

export type BlockWeekProps = {
  block: Block;
  members: readonly Membership[];
  workout: WorkoutLookup;
  /** A plan just added, lit for a moment. */
  lit?: string;
  /** Off once the block has ended: nothing added to it could still happen. */
  canAdd?: boolean;
};

/** A block's week, a row per workout opening it in the block, and + Add under it. */
export function BlockWeek({
  block,
  members,
  workout,
  lit,
  canAdd = true,
}: BlockWeekProps): React.ReactElement {
  const { model } = useHangData();
  const [adding, setAdding] = React.useState(false);
  const rows = planGridRows(members, workout, model, block.name);
  return (
    <View style={{ gap: 12 }}>
      {rows.length === 0 ? (
        <DashedPanel body={t("plan.blockEmpty")} />
      ) : (
        <PlanGrid rows={rows} lit={lit} />
      )}
      {canAdd && (
        <Button
          label={t("plan.addWorkout")}
          accessibilityLabel={t("plan.addToBlock", { name: block.name })}
          onPress={() => setAdding(true)}
          variant="primary"
          icon="plus"
          height={48}
        />
      )}
      <AddKindSheet
        flow={{ date: null, blockId: block.id }}
        visible={adding}
        onClose={() => setAdding(false)}
      />
    </View>
  );
}
