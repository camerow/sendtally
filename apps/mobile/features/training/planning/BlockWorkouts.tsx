import React from "react";
import { Text } from "react-native";
import type { Block } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { blockMembers, useTrainingLog } from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { DashedPanel } from "../components/DashedPanel";
import { SheetSection } from "../components/SheetSection";
import { PlanRows } from "../plan/PlanRows";
import { useLit } from "../plan/useLit";
import { type } from "../type";
import { AddKindSheet } from "./AddKindSheet";

export type BlockWorkoutsProps = {
  block: Block;
  /** A plan just added, lit for a moment. */
  highlight?: string;
};

/** The block's workouts in its editor: × takes one out, tap changes its days and weeks. */
export function BlockWorkouts({ block, highlight }: BlockWorkoutsProps): React.ReactElement {
  const { log } = useTrainingLog(useApi());
  const lit = useLit(highlight);
  const [adding, setAdding] = React.useState(false);
  const members = blockMembers(log.plan, block);
  return (
    <SheetSection label={t("plan.tabWorkouts")}>
      <Text style={[type.body, { fontSize: 13, lineHeight: 18, color: colors.textSecondary }]}>
        {t("plan.workoutChangesSave")}
      </Text>
      {members.length === 0 ? (
        <DashedPanel body={t("plan.blockEmpty")} />
      ) : (
        <PlanRows plan={log.plan} members={members} workout={log.workout} highlight={lit} />
      )}
      <Button
        label={t("plan.addWorkout")}
        onPress={() => setAdding(true)}
        variant="dashed"
        icon="plus"
        height={50}
      />
      <AddKindSheet
        flow={{ date: null, blockId: block.id, editing: true }}
        visible={adding}
        onClose={() => setAdding(false)}
      />
    </SheetSection>
  );
}
