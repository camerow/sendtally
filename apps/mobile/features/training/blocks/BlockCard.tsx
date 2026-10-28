import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import type { Block, Membership } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { WorkoutLookup } from "@sendtally/features/training";
import { pressRow } from "../../../lib/press";
import { Button } from "../components/Button";
import { DashedPanel } from "../components/DashedPanel";
import { FocusTag } from "../components/FocusTag";
import { Title } from "../components/Title";
import { AddKindSheet } from "../planning/AddKindSheet";
import { PlanGrid } from "../plan/PlanGrid";
import { planGridRows } from "../plan/planGridRows";
import { type } from "../type";
import { blockDates } from "./blockText";

export type BlockCardProps = {
  block: Block;
  members: readonly Membership[];
  workout: WorkoutLookup;
};

/** A training block: where it is and what is in it. Tap to open it. */
export function BlockCard({ block, members, workout }: BlockCardProps): React.ReactElement {
  const rows = planGridRows(members, workout);
  const [adding, setAdding] = React.useState(false);
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
          <Title size={26}>{block.name}</Title>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
              {blockDates(block)}
            </Text>
            <FocusTag focus={block.focus} small />
          </View>
        </Pressable>
        <Button
          label={t("hang.add")}
          accessibilityLabel={t("plan.addToBlock", { name: block.name })}
          onPress={() => setAdding(true)}
          variant="outline"
          icon="plus"
          height={40}
        />
      </View>
      {rows.length === 0 ? (
        <DashedPanel body={t("plan.blockEmpty")} />
      ) : (
        <PlanGrid rows={rows} framed={false} />
      )}
      <AddKindSheet
        flow={{ date: null, blockId: block.id }}
        visible={adding}
        onClose={() => setAdding(false)}
      />
    </View>
  );
}
