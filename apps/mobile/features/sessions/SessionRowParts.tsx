import React from "react";
import { Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";

export function DayColumn({
  weekday,
  day,
  marker,
}: {
  weekday: string;
  day: string | number;
  marker?: React.ReactNode;
}): React.ReactElement {
  return (
    <View style={{ width: 34 }}>
      <Text
        style={{
          fontFamily: fonts.monoMedium,
          fontSize: 9,
          lineHeight: 11,
          letterSpacing: 0.72,
          textTransform: "uppercase",
          color: colors.textMuted,
        }}
      >
        {weekday}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 3 }}>
        <Text
          style={{
            fontFamily: fonts.monoSemiBold,
            fontSize: 17,
            lineHeight: 20,
            letterSpacing: -0.2,
            color: colors.gunmetal,
          }}
        >
          {day}
        </Text>
        {marker}
      </View>
    </View>
  );
}

export function RowTitle({ title, meta }: { title: string; meta: string }): React.ReactElement {
  return (
    <>
      <Text
        numberOfLines={1}
        style={{
          fontFamily: fonts.sansSemiBold,
          fontSize: 15,
          lineHeight: 19,
          color: colors.gunmetal,
        }}
      >
        {title}
      </Text>
      <Text
        numberOfLines={1}
        style={{
          fontFamily: fonts.mono,
          fontSize: 11,
          lineHeight: 14,
          color: colors.textSecondary,
        }}
      >
        {meta}
      </Text>
    </>
  );
}
