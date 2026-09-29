import React from "react";
import { Pressable, Text, View } from "react-native";
import { effortWord } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { EffortBars } from "../../components/EffortBars";
import { Label } from "../../components/Label";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";

export type EffortFieldProps = {
  value: number | null;
  onChange: (rpe: number | null) => void;
  surface: "dark" | "light";
  hint?: string;
};

/** Effort: optional, ten bars, the number and its word, clearable. */
export function EffortField({
  value,
  onChange,
  surface,
  hint,
}: EffortFieldProps): React.ReactElement {
  const c = useTheme();
  const dark = surface === "dark";
  const ink = dark ? c.onDark : c.ink;
  const muted = dark ? c.onDark3 : c.ink2;
  return (
    <View style={{ gap: 10 }}>
      <View
        style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}
      >
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
          <Label color={muted}>{t("common.effort")}</Label>
          {value === null ? (
            <Text style={[type.mono, { fontSize: 12, color: muted }]}>
              {t("hang.effortNotSet")}
            </Text>
          ) : (
            <Text style={[type.monoBold, { fontSize: 17, color: ink }]}>
              {value}
              <Text style={{ fontSize: 12, opacity: 0.6 }}>/10</Text>
            </Text>
          )}
        </View>
        {value !== null && (
          <Pressable onPress={() => onChange(null)} accessibilityRole="button" hitSlop={14}>
            <Label small color={dark ? c.rest : c.ink}>
              {t("hang.clear")}
            </Label>
          </Pressable>
        )}
      </View>
      <EffortBars value={value} onChange={onChange} surface={surface} />
      <Text style={[type.body, { fontSize: 13, color: muted }]}>
        {value === null ? (hint ?? t("hang.effortHint")) : effortWord(value)}
      </Text>
    </View>
  );
}
