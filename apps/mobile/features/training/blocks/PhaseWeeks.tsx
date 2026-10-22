import React from "react";
import { Pressable, Text, View } from "react-native";
import type { BlockPhase } from "@sendtally/api-client";
import { nextPhase } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { press } from "../../../lib/press";
import { Label } from "../components/Label";
import { SheetSection } from "../components/SheetSection";
import { type } from "../type";
import { phaseLabel } from "./blockText";
import { PHASE_LOOK } from "./phaseLook";

export type PhaseWeeksProps = { phases: BlockPhase[]; onChange: (phases: BlockPhase[]) => void };

/** One tile per week; a tap moves it on to the next phase. */
export function PhaseWeeks({ phases, onChange }: PhaseWeeksProps): React.ReactElement {
  const cycle = (at: number): void => onChange(phases.map((p, i) => (i === at ? nextPhase(p) : p)));
  return (
    <SheetSection label={t("plan.phases")}>
      <Text style={[type.body, { fontSize: 14, color: colors.textSecondary }]}>
        {t("plan.phasesHint")}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {phases.map((phase, i) => (
          <Pressable
            key={i}
            onPress={() => cycle(i)}
            accessibilityRole="button"
            accessibilityLabel={t("plan.phaseWeek", { n: i + 1, phase: phaseLabel(phase) })}
            style={press({
              width: 72,
              minHeight: 56,
              gap: 4,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              backgroundColor: PHASE_LOOK[phase].tint,
            })}
          >
            <Label small color={colors.textSecondary}>
              {t("plan.weekShort", { n: i + 1 })}
            </Label>
            <Text style={[type.bodyBold, { fontSize: 13, color: PHASE_LOOK[phase].ink }]}>
              {phaseLabel(phase)}
            </Text>
          </Pressable>
        ))}
      </View>
    </SheetSection>
  );
}
