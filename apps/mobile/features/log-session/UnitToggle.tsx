import React from "react";
import { Pressable, Text, View } from "react-native";
import { enduranceUnitLabel, type EnduranceUnit } from "@sendtally/features/log-session";
import { colors, fonts } from "@sendtally/design/tokens";
import { press, tap } from "../../lib/press";

/** What one lap of a circuit is: a number of moves, or a time on the wall. */
export function UnitToggle({
  value,
  onChange,
}: {
  value: EnduranceUnit;
  onChange: (unit: EnduranceUnit) => void;
}): React.ReactElement {
  return (
    <View
      accessibilityRole="radiogroup"
      style={{
        flexDirection: "row",
        height: 30,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
        overflow: "hidden",
      }}
    >
      {(["moves", "seconds"] as const).map((unit) => {
        const active = unit === value;
        return (
          <Pressable
            key={unit}
            onPress={tap(() => onChange(unit))}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            accessibilityLabel={enduranceUnitLabel(unit)}
            hitSlop={{ top: 7, bottom: 7 }}
            style={press({
              height: 28,
              paddingHorizontal: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: active ? "rgba(64,63,76,0.08)" : "transparent",
            })}
          >
            <Text
              style={{
                fontFamily: active ? fonts.monoSemiBold : fonts.monoMedium,
                fontSize: 10,
                letterSpacing: 0.7,
                textTransform: "uppercase",
                color: active ? colors.gunmetal : colors.textFaint,
              }}
            >
              {enduranceUnitLabel(unit)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
