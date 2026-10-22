import React from "react";
import { Text, View } from "react-native";
import type { WeightUnit } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import {
  measureLabel,
  setText,
  type Exercise,
  type ExerciseSet,
  type SetTarget,
} from "@sendtally/features/activities";
import { formatNumber, t } from "@sendtally/features/i18n";
import { type } from "../type";
import { SetValueField } from "./SetValueField";
import { SideToggle } from "./SideToggle";
import { Tick } from "./Tick";

export type SetRowProps = {
  index: number;
  set: ExerciseSet;
  measures: Exercise["measures"];
  /** Undefined hides the target column; null is a set the plan does not prescribe. */
  target: SetTarget | null | undefined;
  unit: WeightUnit;
  template: boolean;
  inSheet: boolean;
  onChange: (set: ExerciseSet) => void;
};

/** One set: its number, the plan's target, what was done, and a tick while logging. */
export function SetRow({
  index,
  set,
  measures,
  target,
  unit,
  template,
  inSheet,
  onChange,
}: SetRowProps): React.ReactElement {
  const n = formatNumber(index + 1);
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        minHeight: 44,
        borderRadius: 10,
        backgroundColor: set.done && !template ? colors.surfaceSoft : undefined,
      }}
    >
      <Text style={[type.monoBold, { width: 24, fontSize: 14, color: colors.gunmetal }]}>{n}</Text>
      {target !== undefined && (
        <Text
          numberOfLines={2}
          style={[type.mono, { flex: 1.2, fontSize: 13, color: colors.textSecondary }]}
        >
          {target === null ? "" : setText(target, unit)}
        </Text>
      )}
      {measures.map((m) =>
        m === "side" ? (
          <SideToggle key={m} value={set.side} onChange={(side) => onChange({ ...set, side })} />
        ) : (
          <SetValueField
            key={m}
            measure={m}
            value={set[m]}
            unit={unit}
            label={`${t("activities.set")} ${n}, ${measureLabel(m)}`}
            inSheet={inSheet}
            onChange={(value) => {
              const next = { ...set };
              if (value === undefined) delete next[m];
              else next[m] = value;
              onChange(next);
            }}
          />
        )
      )}
      {!template && (
        <Tick
          done={set.done}
          label={t("activities.setDone", { n })}
          color={colors.fern}
          onToggle={() => onChange({ ...set, done: !set.done })}
        />
      )}
    </View>
  );
}
