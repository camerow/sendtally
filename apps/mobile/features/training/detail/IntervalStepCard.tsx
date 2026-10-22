import React from "react";
import { Text, View } from "react-native";
import type { WeightUnit } from "@sendtally/core/hang";
import { colors, radius } from "@sendtally/design/tokens";
import {
  sideLabel,
  withMeasure,
  type IntervalSide,
  type IntervalStep,
} from "@sendtally/features/activities";
import { formatNumber, t } from "@sendtally/features/i18n";
import { IconButton } from "../components/IconButton";
import { Segmented } from "../components/Segmented";
import { type } from "../type";
import { DetailTextInput } from "./DetailTextInput";
import { MoveButtons } from "./MoveButtons";
import { SetValueField } from "./SetValueField";

export type IntervalStepCardProps = {
  index: number;
  step: IntervalStep;
  unit: WeightUnit;
  inSheet: boolean;
  first: boolean;
  last: boolean;
  onChange: (step: IntervalStep) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
};

type SideChoice = IntervalSide | "none";

const header = [type.labelSmall, { color: colors.textSecondary }];

const sideOptions = (): { value: SideChoice; label: string }[] => [
  { value: "none", label: t("activities.sideNone") },
  { value: "L", label: sideLabel("L") },
  { value: "R", label: sideLabel("R") },
  { value: "each", label: t("activities.sideEach") },
];

/** One step: what it is, held for a time or done for a count, its load, side, rest after and cue. */
export function IntervalStepCard({
  index,
  step,
  unit,
  inSheet,
  first,
  last,
  onChange,
  onMove,
  onRemove,
}: IntervalStepCardProps): React.ReactElement {
  const n = `${t("activities.step")} ${formatNumber(index + 1)}`;
  const timed = step.measure === "time";
  const workLabel = timed ? t("activities.measureSeconds") : t("activities.measureReps");
  const patch = (next: Partial<IntervalStep>): void => {
    const merged: IntervalStep = { ...step, ...next };
    for (const key of ["seconds", "count", "loadKg", "side", "cue"] as const)
      if (merged[key] === undefined) delete merged[key];
    onChange(merged);
  };
  return (
    <View
      style={{
        gap: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
        borderRadius: radius.cardLg,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <View style={{ flex: 1 }}>
          <DetailTextInput
            value={step.label}
            onChange={(label) => patch({ label })}
            label={n}
            placeholder={t("activities.stepPlaceholder")}
            maxLength={80}
            inSheet={inSheet}
          />
        </View>
        <MoveButtons first={first} last={last} onMove={onMove} />
        <IconButton
          icon="x"
          label={t("activities.removeStep")}
          onPress={onRemove}
          color={colors.textSecondary}
        />
      </View>
      <Segmented
        options={[
          { value: "time", label: t("activities.measureTime") },
          { value: "count", label: t("activities.measureReps") },
        ]}
        value={step.measure}
        onChange={(measure) => onChange(withMeasure(step, measure))}
        height={36}
      />
      <View style={{ flexDirection: "row", gap: 6 }}>
        {[workLabel, t("activities.measureLoad"), t("activities.restAfter")].map((label) => (
          <Text key={label} numberOfLines={1} style={[header, { flex: 1, textAlign: "center" }]}>
            {label}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 6 }}>
        <SetValueField
          measure={timed ? "seconds" : "reps"}
          value={timed ? step.seconds : step.count}
          unit={unit}
          label={`${n}, ${workLabel}`}
          inSheet={inSheet}
          onChange={(value) => patch(timed ? { seconds: value } : { count: value })}
        />
        <SetValueField
          measure="loadKg"
          value={step.loadKg}
          unit={unit}
          label={`${n}, ${t("activities.measureLoad")}`}
          inSheet={inSheet}
          onChange={(loadKg) => patch({ loadKg })}
        />
        <SetValueField
          measure="seconds"
          value={step.restAfter}
          unit={unit}
          label={`${n}, ${t("activities.restAfter")}`}
          inSheet={inSheet}
          onChange={(restAfter) => patch({ restAfter: restAfter ?? 0 })}
        />
      </View>
      <Segmented
        options={sideOptions()}
        value={step.side ?? "none"}
        onChange={(side) => patch({ side: side === "none" ? undefined : side })}
        height={36}
      />
      <DetailTextInput
        value={step.cue ?? ""}
        onChange={(cue) => patch({ cue: cue === "" ? undefined : cue })}
        label={`${n}, ${t("activities.cue")}`}
        placeholder={t("activities.cuePlaceholder")}
        maxLength={200}
        inSheet={inSheet}
        style={{ fontSize: 14 }}
      />
    </View>
  );
}
