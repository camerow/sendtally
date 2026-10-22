import React from "react";
import { View } from "react-native";
import type { WeightUnit } from "@sendtally/core/hang";
import { newIntervalStep, type IntervalsDetail } from "@sendtally/features/activities";
import { formatNumber, t } from "@sendtally/features/i18n";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { Stepper } from "../components/Stepper";
import { colors } from "@sendtally/design/tokens";
import { IntervalStepCard } from "./IntervalStepCard";
import { moved } from "./moved";

export type IntervalsEditorProps = {
  value: IntervalsDetail;
  unit: WeightUnit;
  inSheet: boolean;
  /** Runs the steps in the timer; absent where there is nothing to run yet. */
  onStart?: () => void;
  onChange: (value: IntervalsDetail) => void;
};

const MAX_ROUNDS = 50;
const MAX_STEPS = 30;

const clampRounds = (n: number): number => Math.min(MAX_ROUNDS, Math.max(1, Math.round(n)));

/** Rounds of steps to put in order, and a way to run them. */
export function IntervalsEditor({
  value,
  unit,
  inSheet,
  onStart,
  onChange,
}: IntervalsEditorProps): React.ReactElement {
  const { steps } = value;
  const setSteps = (next: IntervalsDetail["steps"]): void => onChange({ ...value, steps: next });
  const named = steps.some((s) => s.label.trim() !== "");
  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 8 }}>
        <Label color={colors.textSecondary}>{t("activities.rounds")}</Label>
        <Stepper
          value={formatNumber(value.rounds)}
          onCommit={(text) => {
            const n = Number(text.trim());
            if (text.trim() !== "" && Number.isFinite(n))
              onChange({ ...value, rounds: clampRounds(n) });
          }}
          onStep={(direction) =>
            onChange({ ...value, rounds: clampRounds(value.rounds + direction) })
          }
          label={t("activities.rounds")}
          decreaseLabel={t("activities.fewerRounds")}
          increaseLabel={t("activities.moreRounds")}
          surface="plain"
          keyboard="number-pad"
          inSheet={inSheet}
        />
      </View>
      {steps.map((step, i) => (
        <IntervalStepCard
          key={i}
          index={i}
          step={step}
          unit={unit}
          inSheet={inSheet}
          first={i === 0}
          last={i === steps.length - 1}
          onChange={(next) => setSteps(steps.map((s, j) => (j === i ? next : s)))}
          onMove={(direction) => setSteps(moved(steps, i, i + direction))}
          onRemove={() => setSteps(steps.filter((_, j) => j !== i))}
        />
      ))}
      <Button
        label={t("activities.addStep")}
        icon="plus"
        variant="dashed"
        disabled={steps.length >= MAX_STEPS}
        onPress={() => setSteps([...steps, newIntervalStep()])}
      />
      {onStart !== undefined && (
        <Button
          label={t("hang.start")}
          icon="play"
          variant="primary"
          height={50}
          disabled={!named}
          onPress={onStart}
        />
      )}
    </View>
  );
}
