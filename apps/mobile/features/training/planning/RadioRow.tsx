import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { pressRow } from "../../../lib/press";
import { type } from "../type";

export type RadioRowProps = { title: string; sub: string; on: boolean; onPress: () => void };

/** One choice of several: a dot, a title and a line under it. */
export function RadioRow({ title, sub, on, onPress }: RadioRowProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={title}
      style={pressRow({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLightSoft,
      })}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: on ? 7 : 1.5,
          borderColor: on ? colors.gunmetal : colors.lineOnLightStrong,
        }}
      />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>{title}</Text>
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>{sub}</Text>
      </View>
    </Pressable>
  );
}
