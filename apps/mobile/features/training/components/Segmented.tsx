import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { type } from "../type";

export type SegmentedOption<T extends string> = { value: T; label: string };

export type SegmentedProps<T extends string> = {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  height?: number;
};

/** A soft track with the chosen option lifted onto white. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  height = 44,
}: SegmentedProps<T>): React.ReactElement {
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: "row",
        padding: 4,
        borderRadius: 12,
        backgroundColor: colors.surfaceSoft,
      }}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={{
              flex: 1,
              height,
              borderRadius: 9,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: on ? colors.white : undefined,
              boxShadow: on ? "0 1px 3px rgba(64,63,76,0.18)" : undefined,
            }}
          >
            <Text
              numberOfLines={1}
              style={[
                type.bodyBold,
                { fontSize: 14, color: on ? colors.gunmetal : colors.textSecondary },
              ]}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
