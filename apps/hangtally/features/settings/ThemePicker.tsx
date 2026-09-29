import React from "react";
import { Pressable, Text, View } from "react-native";
import type { ThemeName } from "@sendtally/core/hang";
import { t, type MessageKey } from "@sendtally/features/i18n";
import { SheetSection } from "../../components/SheetSection";
import { useTheme } from "../../theme/ThemeContext";
import { PALETTES, THEME_ORDER } from "../../theme/themes";
import { type } from "../../theme/type";
import { useHangData } from "../data/HangDataContext";

const NAMES: Record<ThemeName, MessageKey> = {
  moss: "hang.themeMoss",
  dusk: "hang.themeDusk",
  gunmetal: "hang.themeGunmetal",
};

/** Moss, Dusk or Gunmetal, as ground, accent and rest swatches. Applies at once. */
export function ThemePicker(): React.ReactElement {
  const c = useTheme();
  const { model, actions } = useHangData();
  return (
    <SheetSection label={t("hang.theme")}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {THEME_ORDER.map((name) => {
          const p = PALETTES[name];
          const on = model.settings.theme === name;
          return (
            <Pressable
              key={name}
              onPress={() => void actions.saveSettings({ theme: name })}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={{
                flex: 1,
                alignItems: "center",
                gap: 8,
                paddingTop: 12,
                paddingHorizontal: 8,
                paddingBottom: 10,
                borderRadius: 14,
                borderWidth: on ? 2 : 1,
                borderColor: on ? c.ink : c.lineLight,
                backgroundColor: on ? c.soft : undefined,
              }}
            >
              <View
                style={{
                  alignSelf: "stretch",
                  height: 44,
                  borderRadius: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  backgroundColor: p.ground,
                }}
              >
                <View
                  style={{ width: 22, height: 8, borderRadius: 2, backgroundColor: p.accent }}
                />
                <View style={{ width: 10, height: 8, borderRadius: 2, backgroundColor: p.rest }} />
              </View>
              <Text style={[type.bodyBold, { fontSize: 14, color: c.ink }]}>{t(NAMES[name])}</Text>
            </Pressable>
          );
        })}
      </View>
    </SheetSection>
  );
}
