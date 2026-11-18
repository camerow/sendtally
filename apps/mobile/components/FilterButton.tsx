import React from "react";
import { Pressable, View } from "react-native";
import { colors, radius } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { Icon, type IconName } from "./Icon";
import { press } from "../lib/press";

export const FILTER_BAR_HEIGHT = 44;

export type FilterButtonProps = {
  active: boolean;
  onPress: () => void;
  /** A magnifier before the funnel, when the bar can be searched. */
  onSearch?: () => void;
};

function RoundButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: IconName;
  label: string;
  active: boolean;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
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
      <Icon name={icon} size={18} color={colors.gunmetal} />
    </Pressable>
  );
}

export function FilterButton({ active, onPress, onSearch }: FilterButtonProps): React.ReactElement {
  return (
    <View
      style={{
        height: FILTER_BAR_HEIGHT,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingLeft: onSearch === undefined ? 4 : 6,
        paddingRight: 10,
        borderLeftWidth: 1,
        borderLeftColor: colors.lineOnLightSoft,
      }}
    >
      {onSearch !== undefined && (
        <RoundButton
          icon="search"
          label={t("sessions.searchLog")}
          active={false}
          onPress={onSearch}
        />
      )}
      <RoundButton icon="funnel" label={t("common.filters")} active={active} onPress={onPress} />
    </View>
  );
}
