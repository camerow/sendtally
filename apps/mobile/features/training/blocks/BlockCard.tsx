import React from "react";
import { Pressable, Text, View } from "react-native";
import type { DatedBlock, Membership } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { WorkoutLookup } from "@sendtally/features/training";
import { pressRow } from "../../../lib/press";
import { DashedPanel } from "../components/DashedPanel";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { PlanGrid } from "../plan/PlanGrid";
import { planGridRows } from "../plan/planGridRows";
import { type } from "../type";
import { blockDates } from "./blockText";
import { openBlock } from "./openBlock";

export type BlockCardProps = {
  block: DatedBlock;
  members: readonly Membership[];
  workout: WorkoutLookup;
};

/** A training block: where it is and what is in it. Tap to open it. */
export function BlockCard({ block, members, workout }: BlockCardProps): React.ReactElement {
  const { model } = useHangData();
  const rows = planGridRows(members, workout, model, { back: t("training.train") });
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
      <Pressable
        onPress={() => openBlock(block.id, t("training.train"))}
        accessibilityRole="button"
        accessibilityLabel={t("plan.openBlock", { name: block.name })}
        style={pressRow({ gap: 4 })}
      >
        <Title size={26}>{block.name}</Title>
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
          {blockDates(block)}
        </Text>
      </Pressable>
      {rows.length === 0 ? (
        <DashedPanel body={t("plan.blockEmpty")} />
      ) : (
        <PlanGrid rows={rows} framed={false} />
      )}
    </View>
  );
}
