import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { press } from "../../../lib/press";
import { type } from "../type";

export type Chip<T extends string> = { value: T; label: string; mark?: string };

export type ChipRowProps<T extends string> = {
  options: readonly Chip<T>[];
  value: T;
  onChange: (value: T) => void;
  /** One scrolling line instead of wrapping. */
  scroll?: boolean;
};

/** Pick one: a chip per option, the chosen one filled, each with its colour mark when it has one. */
export function ChipRow<T extends string>({
  options,
  value,
  onChange,
  scroll = false,
}: ChipRowProps<T>): React.ReactElement {
  const chips = options.map((o) => {
    const on = o.value === value;
    return (
      <Pressable
        key={o.value}
        onPress={() => onChange(o.value)}
        accessibilityRole="radio"
        accessibilityState={{ checked: on }}
        style={press({
          height: 44,
          paddingHorizontal: 14,
          borderRadius: 22,
          flexDirection: "row",
          alignItems: "center",
          gap: 7,
          backgroundColor: on ? colors.gunmetal : colors.surfaceSoft,
        })}
      >
        {o.mark !== undefined && (
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              backgroundColor: o.mark,
              ...(on && { borderWidth: 1.5, borderColor: colors.white }),
            }}
          />
        )}
        <Text
          style={[type.bodyBold, { fontSize: 13.5, color: on ? colors.white : colors.gunmetal }]}
        >
          {o.label}
        </Text>
      </Pressable>
    );
  });
  return scroll ? (
    <ScrollView
      horizontal
      accessibilityRole="radiogroup"
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      style={{ marginHorizontal: -18 }}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 18 }}
    >
      {chips}
    </ScrollView>
  ) : (
    <View accessibilityRole="radiogroup" style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {chips}
    </View>
  );
}
