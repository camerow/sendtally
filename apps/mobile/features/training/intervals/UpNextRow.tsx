import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { ON_DARK, ON_DARK_MUTED, ON_DARK_SOFT, ON_DARK_TRACK } from "../components/onDark";
import { type } from "../type";
import type { UpNextItem } from "./intervalsText";

const WORK_BADGE = "rgba(249,220,92,0.18)";
const REST_BADGE = "rgba(204,121,234,0.2)";

/** One coming phase: a side badge, the step or Rest, and how long or how many. */
export function UpNextRow({ item }: { item: UpNextItem }): React.ReactElement {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        minHeight: 48,
        borderBottomWidth: 1,
        borderBottomColor: ON_DARK_TRACK,
      }}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: item.rest ? REST_BADGE : WORK_BADGE,
        }}
      >
        <Text
          style={[
            type.monoBold,
            { fontSize: 11, color: item.rest ? colors.petalTint : colors.gold },
          ]}
        >
          {item.side}
        </Text>
      </View>
      <Text
        numberOfLines={1}
        style={[type.body, { flex: 1, fontSize: 15, color: item.rest ? ON_DARK_MUTED : ON_DARK }]}
      >
        {item.name}
      </Text>
      <Text style={[type.mono, { fontSize: 14, color: ON_DARK_SOFT }]}>{item.dose}</Text>
    </View>
  );
}
