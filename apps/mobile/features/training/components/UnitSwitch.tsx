import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import type { WeightUnit } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { useHangData } from "../data/HangDataContext";
import { type } from "../type";

const UNITS: readonly WeightUnit[] = ["kg", "lb"];

/** The small kg | lb switch beside load inputs. It changes the one units setting. */
export function UnitSwitch(): React.ReactElement {
  const { model, actions } = useHangData();
  const current = model.settings.units;
  return (
    <View
      style={{
        flexDirection: "row",
        padding: 3,
        borderRadius: 9,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.lineOnLight,
      }}
    >
      {UNITS.map((u) => {
        const on = u === current;
        return (
          <Pressable
            key={u}
            onPress={() => void actions.saveSettings({ units: u })}
            accessibilityRole="button"
            accessibilityLabel={u === "kg" ? t("hang.showKg") : t("hang.showLb")}
            accessibilityState={{ selected: on }}
            hitSlop={6}
            style={{
              height: 32,
              width: 44,
              borderRadius: 7,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: on ? colors.gunmetal : undefined,
            }}
          >
            <Text
              style={[
                type.monoBold,
                { fontSize: 13, color: on ? colors.white : colors.textSecondary },
              ]}
            >
              {u}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
