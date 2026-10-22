import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import {
  HANG_TRACK,
  ON_DARK,
  ON_DARK_MUTED,
  ON_DARK_SOFT,
  ON_DARK_TRACK,
  REST_TRACK,
} from "../components/onDark";
import { type } from "../type";
import type { UpNextItem } from "./intervalsText";

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
          backgroundColor: item.rest ? REST_TRACK : HANG_TRACK,
        }}
      >
        <Text
          style={[
            type.monoBold,
            { fontSize: 11, color: item.rest ? colors.dataFernSoft : colors.dataAzureSoft },
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
