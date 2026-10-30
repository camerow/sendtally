import React from "react";
import { Pressable, Text, View } from "react-native";
import type { SetDone, WeightUnit } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { setText } from "@sendtally/features/activities";
import { formatNumber, t } from "@sendtally/features/i18n";
import { press } from "../../../lib/press";
import { CheckBox } from "../components/CheckBox";
import { type } from "../type";
import { SET_COLUMNS } from "./setColumns";
import { SetDoneFields } from "./SetDoneFields";

export type SetRowProps = {
  n: number;
  target: SetDone;
  done: SetDone;
  previous: SetDone | undefined;
  lifting: boolean;
  ticked: boolean;
  current: boolean;
  unit: WeightUnit;
  label: string;
  onChange: (set: SetDone) => void;
  onToggle: () => void;
};

/** One set: its number, what it asks and did last time, what was done, and its tick. */
export function SetRow({
  n,
  target,
  done,
  previous,
  lifting,
  ticked,
  current,
  unit,
  label,
  onChange,
  onToggle,
}: SetRowProps): React.ReactElement {
  return (
    <View
      style={[
        SET_COLUMNS.row,
        {
          minHeight: 48,
          borderRadius: 10,
          backgroundColor: current ? colors.surfaceSoft : undefined,
          borderWidth: current ? 1.5 : 0,
          borderColor: colors.gunmetal,
        },
      ]}
    >
      <Text style={[type.monoBold, SET_COLUMNS.set, { fontSize: 14, color: colors.gunmetal }]}>
        {formatNumber(n)}
      </Text>
      <View style={[SET_COLUMNS.target, { gap: 2 }]}>
        <Text style={[type.mono, { fontSize: 14, color: colors.textSecondary }]}>
          {setText(target, unit) || "-"}
        </Text>
        {previous !== undefined && setText(previous, unit) !== "" && (
          <Text style={[type.mono, { fontSize: 11, color: colors.textMuted }]}>
            {t("activities.previousSet", { set: setText(previous, unit) })}
          </Text>
        )}
      </View>
      <View style={SET_COLUMNS.done}>
        {ticked || current ? (
          <SetDoneFields
            set={done}
            lifting={lifting}
            unit={unit}
            label={label}
            onChange={onChange}
          />
        ) : (
          <Text style={[type.monoBold, { fontSize: 14, color: colors.textMuted }]}>-</Text>
        )}
      </View>
      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: ticked }}
        accessibilityLabel={label}
        style={press({ width: 44, height: 44, alignItems: "center", justifyContent: "center" })}
      >
        <CheckBox checked={ticked} color={colors.fern} />
      </Pressable>
    </View>
  );
}
