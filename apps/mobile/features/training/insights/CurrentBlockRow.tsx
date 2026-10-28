import { router } from "expo-router";
import React from "react";
import { Pressable, Text } from "react-native";
import { blockWeekOn } from "@sendtally/core/hang";
import { colors, radius } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { blockDone, blockGroups, useTrainingLog } from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { pressRow } from "../../../lib/press";
import { useHangData } from "../data/HangDataContext";
import { type } from "../type";

/** The block running today, how far in and how much of it is done; nothing outside a block. */
export function CurrentBlockRow(): React.ReactElement | null {
  const { today } = useHangData();
  const { log } = useTrainingLog(useApi());
  const block = blockGroups(log.plan.blocks, today).current[0];
  if (block === undefined) return null;
  const done = blockDone(log, block, today);
  const meta = [
    t("statistics.blockWeek", { at: blockWeekOn(block, today) ?? 1, of: block.weeks }),
    ...(done.planned > 0 ? [t("plan.doneOf", done)] : []),
  ].join(" · ");
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/plan/block/[id]", params: { id: block.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${block.name}, ${meta}`}
      style={pressRow({
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        paddingHorizontal: 12,
        borderRadius: radius.control + 2,
        backgroundColor: colors.surfaceSoft,
      })}
    >
      <Text
        numberOfLines={1}
        style={[type.bodyBold, { flexShrink: 1, fontSize: 14, color: colors.gunmetal }]}
      >
        {block.name}
      </Text>
      <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>{meta}</Text>
    </Pressable>
  );
}
