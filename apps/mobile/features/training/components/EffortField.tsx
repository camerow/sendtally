import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { effortWord } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { type } from "../type";
import { Button } from "./Button";
import { EffortBars } from "./EffortBars";
import { Label } from "./Label";

export type EffortFieldProps = {
  value: number | null;
  onChange: (rpe: number | null) => void;
  hint?: string;
};

/** Effort: optional, ten bars, the number and its word, clearable. */
export function EffortField({ value, onChange, hint }: EffortFieldProps): React.ReactElement {
  return (
    <View style={{ gap: 10 }}>
      <Label color={colors.textSecondary}>{t("common.effort")}</Label>
      <EffortBars value={value} onChange={onChange} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, minHeight: 44 }}>
        {value !== null && (
          <Text style={[type.monoBold, { fontSize: 26, color: colors.gunmetal }]}>
            {value}
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>/10</Text>
          </Text>
        )}
        <Text style={[type.body, { flex: 1, fontSize: 15, color: colors.textSecondary }]}>
          {value === null ? (hint ?? t("hang.effortHint")) : effortWord(value)}
        </Text>
        {value !== null && (
          <Button
            label={t("hang.clear")}
            onPress={() => onChange(null)}
            variant="link"
            height={44}
          />
        )}
      </View>
    </View>
  );
}
