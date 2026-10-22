import React from "react";
import { Pressable, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import type { TimeUnit } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { Label } from "../components/Label";

/** sec | min beside a time field: how it is typed and stepped. */
export function TimeUnitToggle({
  unit,
  onUnit,
}: {
  unit: TimeUnit;
  onUnit: (u: TimeUnit) => void;
}): React.ReactElement {
  const option = (u: TimeUnit, label: string): React.ReactElement => {
    const on = u === unit;
    return (
      <Pressable
        onPress={() => onUnit(u)}
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
        hitSlop={8}
        style={{
          paddingHorizontal: 7,
          paddingVertical: 3,
          borderRadius: 5,
          backgroundColor: on ? colors.gunmetal : undefined,
          borderWidth: on ? 0 : 1,
          borderColor: colors.lineOnLightStrong,
        }}
      >
        <Label color={on ? colors.white : colors.textSecondary}>{label}</Label>
      </Pressable>
    );
  };
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {option("s", t("hang.unitSec"))}
      {option("min", t("hang.unitMin"))}
    </View>
  );
}
