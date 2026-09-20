import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Icon } from "./Icon";
import { pressRow, tap } from "../lib/press";

/** One choice inside a SelectRow sheet: label, optional leading mark, check when selected. */
export function OptionRow({
  label,
  detail,
  selected,
  leading,
  mono = true,
  onPress,
}: {
  label: string;
  detail?: string;
  selected: boolean;
  leading?: React.ReactNode;
  mono?: boolean;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={detail === undefined ? label : `${label}, ${detail}`}
      onPress={tap(onPress)}
      style={pressRow({
        height: 48,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 12,
        borderRadius: radius.control,
        backgroundColor: selected ? "rgba(249,220,92,0.35)" : "transparent",
      })}
    >
      {leading}
      <Text
        style={{
          flex: 1,
          fontFamily: mono
            ? selected
              ? fonts.monoSemiBold
              : fonts.monoMedium
            : selected
              ? fonts.sansSemiBold
              : fonts.sans,
          fontSize: 15,
          color: colors.gunmetal,
        }}
      >
        {label}
      </Text>
      {detail !== undefined && (
        <Text style={{ fontFamily: fonts.monoMedium, fontSize: 11, color: colors.textMuted }}>
          {detail}
        </Text>
      )}
      <View style={{ width: 18 }}>
        {selected && <Icon name="check" color={colors.gunmetal} size={18} strokeWidth={2.2} />}
      </View>
    </Pressable>
  );
}
