import React from "react";
import { Pressable, View } from "react-native";
import { colors, radius } from "@sendtally/design/tokens";
import { Icon } from "./Icon";
import { press } from "../lib/press";

export const FILTER_BAR_HEIGHT = 44;

export type FilterButtonProps = {
  active: boolean;
  onPress: () => void;
};

export function FilterButton({ active, onPress }: FilterButtonProps): React.ReactElement {
  return (
    <View
      style={{
        height: FILTER_BAR_HEIGHT,
        justifyContent: "center",
        paddingLeft: 4,
        paddingRight: 10,
        borderLeftWidth: 1,
        borderLeftColor: colors.lineOnLightSoft,
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Filters"
        accessibilityState={{ selected: active }}
        hitSlop={4}
        style={press({
          width: 36,
          height: 36,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: active ? colors.gold : colors.lineOnLightStrong,
          backgroundColor: active ? colors.gold : "transparent",
        })}
      >
        <Icon name="funnel" size={18} color={colors.gunmetal} />
      </Pressable>
    </View>
  );
}
