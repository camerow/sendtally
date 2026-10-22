import React from "react";
import { Text, View } from "react-native";
import type { TrainingBlock } from "@sendtally/api-client";
import { phaseOn } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { BlockMembers, BlockWeek } from "@sendtally/features/training";
import { Button } from "../components/Button";
import { DashedPanel } from "../components/DashedPanel";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { PlanGrid } from "../plan/PlanGrid";
import { planGridRows } from "../plan/planGridRows";
import { PlanRows } from "../plan/PlanRows";
import type { PlanRequest } from "../plan/types";
import { type } from "../type";
import { BlockEffort } from "./BlockEffort";
import { blockDates, blockKicker, phaseLabel } from "./blockText";
import { PHASE_LOOK } from "./phaseLook";

export type BlockCardProps = {
  block: TrainingBlock;
  members: BlockMembers;
  weeks: readonly BlockWeek[];
  onPlan: (request: PlanRequest) => void;
};

/** A training block: where it is, what is in it, and planned against actual effort by week. */
export function BlockCard({ block, members, weeks, onPlan }: BlockCardProps): React.ReactElement {
  const { model, today } = useHangData();
  const rows = planGridRows(members.schedules, members.items, model);
  const phase = phaseOn(block, today);
  return (
    <View
      style={{
        gap: 14,
        padding: 18,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
      }}
    >
      <View style={{ gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Label color={colors.labelAccent} style={{ flex: 1 }}>
            {blockKicker(block, today)}
          </Label>
          {phase !== null && (
            <Label
              small
              color={PHASE_LOOK[phase].ink}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                overflow: "hidden",
                backgroundColor: PHASE_LOOK[phase].tint,
              }}
            >
              {phaseLabel(phase)}
            </Label>
          )}
        </View>
        <Title size={26}>{block.name}</Title>
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
          {blockDates(block)}
        </Text>
      </View>
      {rows.length === 0 ? (
        <DashedPanel body={t("plan.blockEmpty")} />
      ) : (
        <>
          <PlanGrid rows={rows} framed={false} />
          <BlockEffort weeks={weeks} />
          <PlanRows schedules={members.schedules} items={members.items} onPlan={onPlan} />
        </>
      )}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button
          label={t("plan.editBlock")}
          onPress={() => onPlan({ mode: "block", block })}
          variant="outline"
          height={46}
          style={{ flex: 1 }}
        />
        <Button
          label={t("plan.addToBlock")}
          onPress={() =>
            onPlan({ mode: "choose", days: [], start: block.start, blockId: block.id })
          }
          variant="primary"
          icon="plus"
          height={46}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}
