import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import type { Plan } from "@sendtally/api-client";
import type { Block, Membership } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { BlockWeek, WorkoutLookup } from "@sendtally/features/training";
import { pressRow } from "../../../lib/press";
import { Button } from "../components/Button";
import { DashedPanel } from "../components/DashedPanel";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { PlanGrid } from "../plan/PlanGrid";
import { planGridRows } from "../plan/planGridRows";
import { PlanRows } from "../plan/PlanRows";
import { type } from "../type";
import { BlockEffort } from "./BlockEffort";
import { blockDates, blockKicker } from "./blockText";

export type BlockCardProps = {
  block: Block;
  plan: Plan;
  members: readonly Membership[];
  workout: WorkoutLookup;
  weeks: readonly BlockWeek[];
  highlight?: string | null;
};

/** A training block: where it is, what is in it, and the effort logged by week. Tap to open it. */
export function BlockCard({
  block,
  plan,
  members,
  workout,
  weeks,
  highlight,
}: BlockCardProps): React.ReactElement {
  const { today } = useHangData();
  const rows = planGridRows(members, workout);
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
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        <Pressable
          onPress={() => router.push({ pathname: "/plan/block/[id]", params: { id: block.id } })}
          accessibilityRole="button"
          accessibilityLabel={t("plan.openBlock", { name: block.name })}
          style={pressRow({ flex: 1, gap: 4 })}
        >
          <Label color={colors.labelAccent}>{blockKicker(block, today)}</Label>
          <Title size={26}>{block.name}</Title>
          <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
            {blockDates(block)}
          </Text>
        </Pressable>
        <Button
          label={t("hang.add")}
          accessibilityLabel={t("plan.addToBlock", { name: block.name })}
          onPress={() => router.push({ pathname: "/plan/add", params: { blockId: block.id } })}
          variant="outline"
          icon="plus"
          height={40}
        />
      </View>
      {rows.length === 0 ? (
        <DashedPanel body={t("plan.blockEmpty")} />
      ) : (
        <>
          <PlanGrid rows={rows} framed={false} />
          <BlockEffort weeks={weeks} />
          <PlanRows plan={plan} members={members} workout={workout} highlight={highlight} />
        </>
      )}
    </View>
  );
}
