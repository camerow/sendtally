import React from "react";
import { Pressable, Text, View } from "react-native";
import type { SetMeasure } from "@sendtally/api-client";
import { colors } from "@sendtally/design/tokens";
import { SET_MEASURES, measureLabel } from "@sendtally/features/activities";
import { type } from "../type";

export type MeasureChipsProps = {
  value: readonly SetMeasure[];
  onToggle: (measure: SetMeasure) => void;
};

/** Which numbers an exercise's sets record. */
export function MeasureChips({ value, onToggle }: MeasureChipsProps): React.ReactElement {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
      {SET_MEASURES.map((m) => {
        const on = value.includes(m);
        return (
          <Pressable
            key={m}
            onPress={() => onToggle(m)}
            accessibilityRole="checkbox"
            accessibilityLabel={measureLabel(m)}
            accessibilityState={{ checked: on }}
            style={{
              minHeight: 44,
              paddingHorizontal: 12,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: on ? colors.gunmetal : undefined,
              borderWidth: on ? 0 : 1,
              borderColor: colors.lineOnLightStrong,
            }}
          >
            <Text style={[type.labelSmall, { color: on ? colors.white : colors.gunmetal }]}>
              {measureLabel(m)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
