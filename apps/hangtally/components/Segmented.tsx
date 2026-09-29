import React from "react";
import { Pressable, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { type } from "../theme/type";

export type SegmentedOption<T extends string> = { value: T; label: string };

export type SegmentedProps<T extends string> = {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  surface: "dark" | "light";
  height?: number;
};

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  surface,
  height = 38,
}: SegmentedProps<T>): React.ReactElement {
  const c = useTheme();
  const dark = surface === "dark";
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: "row",
        padding: 4,
        borderRadius: 12,
        backgroundColor: dark ? c.deep : c.soft,
      }}
    >
      {options.map((o) => {
        const on = o.value === value;
        const fill = dark ? c.accent : c.card;
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
              backgroundColor: on ? fill : undefined,
              boxShadow: on && !dark ? `0 1px 3px ${c.lineLight}` : undefined,
            }}
          >
            <Text
              style={[
                type.bodyBold,
                {
                  fontSize: 14,
                  color: on ? (dark ? c.ground : c.ink) : dark ? c.onDark2 : c.ink2,
                },
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
