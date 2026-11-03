import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";
import { press } from "../../lib/press";

/** The one workout the log is narrowed to, from Stats; the pill clears it. */
export function WorkoutFilterBar({
  name,
  onClear,
}: {
  name: string;
  onClear: () => void;
}): React.ReactElement {
  const label = t("sessions.onlyWorkout", { name });
  return (
    <View style={{ flexDirection: "row", paddingHorizontal: 18, paddingVertical: 8 }}>
      <Pressable
        onPress={onClear}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${t("common.clear")}`}
        hitSlop={{ top: 7, bottom: 7 }}
        style={press({
          height: 30,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingLeft: 11,
          paddingRight: 9,
          borderRadius: 15,
          backgroundColor: colors.gold,
        })}
      >
        <Text
          numberOfLines={1}
          style={{
            flexShrink: 1,
            fontFamily: fonts.monoMedium,
            fontSize: 11,
            lineHeight: 14,
            letterSpacing: 0.66,
            textTransform: "uppercase",
            color: colors.gunmetal,
          }}
        >
          {label}
        </Text>
        <Icon name="x" color={colors.gunmetal} size={14} />
      </Pressable>
    </View>
  );
}
