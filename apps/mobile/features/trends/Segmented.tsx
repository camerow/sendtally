import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";

export type SegmentVM = {
  key: string;
  label: string;
  on: boolean;
  onPress: () => void;
  lead?: React.ReactNode;
};

/** Dark pill on white for the discipline; soft for a switch inside a sheet. */
export function Segmented({
  segments,
  label,
  soft = false,
}: {
  segments: SegmentVM[];
  label: string;
  soft?: boolean;
}): React.ReactElement {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={{
        flexDirection: "row",
        padding: 3,
        gap: 3,
        borderRadius: soft ? 10 : 12,
        backgroundColor: soft ? colors.surfaceSoft : colors.white,
        borderWidth: soft ? 0 : 1,
        borderColor: "rgba(64,63,76,0.14)",
      }}
    >
      {segments.map((s) => (
        <Pressable
          key={s.key}
          accessibilityRole="radio"
          accessibilityState={{ checked: s.on }}
          onPress={s.onPress}
          style={{
            flex: 1,
            height: soft ? 38 : 40,
            borderRadius: soft ? 8 : 9,
            flexDirection: "row",
            gap: 6,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 6,
            backgroundColor: s.on ? (soft ? colors.white : colors.gunmetal) : "transparent",
          }}
        >
          {s.lead}
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fonts.sansSemiBold,
              fontSize: soft ? 13 : 14,
              color: s.on ? (soft ? colors.gunmetal : colors.white) : colors.textSecondary,
            }}
          >
            {s.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
