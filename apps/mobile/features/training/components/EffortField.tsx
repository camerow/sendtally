import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { effortWord } from "@sendtally/features/hang";
import { formatNumber, t } from "@sendtally/features/i18n";
import { type } from "../type";
import { Button } from "./Button";
import { EffortBars } from "./EffortBars";
import { Label } from "./Label";

export type EffortFieldProps = {
  value: number | null;
  /** The session's Target RPE, beside the label. */
  target?: number;
  onChange: (rpe: number | null) => void;
};

/** RPE: optional, ten bars, the number and its word, clearable; its target beside the label. */
export function EffortField({ value, target, onChange }: EffortFieldProps): React.ReactElement {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Label color={colors.textSecondary}>RPE</Label>
        {target !== undefined && (
          <Text style={[type.monoBold, { fontSize: 14, color: colors.gunmetal }]}>
            {t("common.targetRpe", { n: formatNumber(target) })}
          </Text>
        )}
      </View>
      <EffortBars value={value} onChange={onChange} />
      {value !== null && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, minHeight: 44 }}>
          <Text style={[type.monoBold, { fontSize: 26, color: colors.gunmetal }]}>
            {value}
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>/10</Text>
          </Text>
          <Text style={[type.body, { flex: 1, fontSize: 15, color: colors.textSecondary }]}>
            {effortWord(value)}
          </Text>
          <Button
            label={t("hang.clear")}
            onPress={() => onChange(null)}
            variant="link"
            height={44}
          />
        </View>
      )}
    </View>
  );
}
