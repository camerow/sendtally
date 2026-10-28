import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { pressRow } from "../../../lib/press";
import { EffortMark } from "../components/EffortMark";
import { GOLD_TINT } from "../components/tints";
import { type } from "../type";
import type { HistoryItem } from "./types";

export type HistoryRowProps = { item: HistoryItem; onPress: () => void };

/** A past session: its date, name and one line of what mattered, with its effort. */
export function HistoryRow({ item, onPress }: HistoryRowProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      disabled={item.current === true}
      accessibilityRole="button"
      style={pressRow({
        minHeight: 56,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 8,
        marginHorizontal: -8,
        borderRadius: 10,
        backgroundColor: item.current === true ? GOLD_TINT : undefined,
      })}
    >
      <Text style={[type.mono, { width: 52, fontSize: 12, color: colors.textSecondary }]}>
        {item.date}
      </Text>
      <View style={{ flex: 1, gap: 2 }}>
        <Text numberOfLines={1} style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>
          {item.name}
        </Text>
        {item.meta !== "" && (
          <Text
            numberOfLines={1}
            style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}
          >
            {item.meta}
          </Text>
        )}
        {item.note != null && (
          <Text style={[type.body, { fontSize: 14, lineHeight: 20, color: colors.gunmetal }]}>
            {item.note}
          </Text>
        )}
      </View>
      {item.rpe !== null && <EffortMark rpe={item.rpe} />}
    </Pressable>
  );
}
