import React from "react";
import { Pressable, View } from "react-native";
import type { WeightUnit } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { useHangData } from "../features/data/HangDataContext";
import { useTheme } from "../theme/ThemeContext";
import { Label } from "./Label";

const UNITS: readonly WeightUnit[] = ["kg", "lb"];

/** The small kg | lb switch beside load inputs. It changes the one units setting. */
export function UnitSwitch(): React.ReactElement {
  const c = useTheme();
  const { model, actions } = useHangData();
  const current = model.settings.units;
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {UNITS.map((u) => {
        const on = u === current;
        return (
          <Pressable
            key={u}
            onPress={() => void actions.saveSettings({ units: u })}
            accessibilityRole="button"
            accessibilityLabel={u === "kg" ? t("hang.showKg") : t("hang.showLb")}
            accessibilityState={{ selected: on }}
            hitSlop={8}
            style={{
              paddingHorizontal: 9,
              paddingVertical: 5,
              borderRadius: 6,
              backgroundColor: on ? c.ink : undefined,
              borderWidth: on ? 0 : 1,
              borderColor: c.lineLight,
            }}
          >
            <Label color={on ? c.card : c.ink2}>{u}</Label>
          </Pressable>
        );
      })}
    </View>
  );
}
