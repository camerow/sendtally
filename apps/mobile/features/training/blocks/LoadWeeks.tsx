import React from "react";
import { Pressable, Text, View } from "react-native";
import type { BlockPhase, WeekLoad } from "@sendtally/api-client";
import {
  BASE_WEEK_LOAD,
  clampWeekLoad,
  nextPhase,
  parseNumber,
  stepWeekLoad,
  withShape,
} from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { press } from "../../../lib/press";
import { SheetSection } from "../components/SheetSection";
import { Stepper } from "../components/Stepper";
import { type } from "../type";
import { phaseLabel } from "./blockText";
import { LoadBars } from "./LoadBars";
import { LoadShapes } from "./LoadShapes";
import { PHASE_LOOK } from "./phaseLook";

const tagged = (load: number, phase: BlockPhase | undefined): WeekLoad =>
  phase === undefined ? { load } : { load, phase };

export type LoadWeeksProps = { loads: WeekLoad[]; onChange: (loads: WeekLoad[]) => void };

/** Load by week: the block's series, the picked week's load and phase tag, and quick shapes. */
export function LoadWeeks({ loads, onChange }: LoadWeeksProps): React.ReactElement {
  const [selected, setSelected] = React.useState(0);
  const at = Math.min(selected, loads.length - 1);
  const week = loads[at] ?? { load: BASE_WEEK_LOAD };
  const set = (next: WeekLoad): void => onChange(loads.map((w, i) => (i === at ? next : w)));
  const phase = week.phase;
  const phaseText = phase === undefined ? t("plan.noPhase") : phaseLabel(phase);

  return (
    <SheetSection label={t("plan.loads")} gap={12}>
      <Text style={[type.body, { fontSize: 14, color: colors.textSecondary }]}>
        {t("plan.loadsHint")}
      </Text>
      <LoadBars loads={loads} selected={at} onSelect={setSelected} />
      <View style={{ gap: 8 }}>
        <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>
          {t("hang.statusWeek", { at: at + 1, of: loads.length })}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Stepper
            value={String(week.load)}
            onCommit={(text) => {
              const n = parseNumber(text);
              if (n !== null) set(tagged(clampWeekLoad(n), phase));
            }}
            onStep={(dir) => set(tagged(stepWeekLoad(week.load, dir), phase))}
            label={t("plan.weekLoad", { n: at + 1 })}
            decreaseLabel={t("plan.lighter")}
            increaseLabel={t("plan.heavier")}
            surface="plain"
            inputWidth={64}
            keyboard="number-pad"
            inSheet
          />
          <Pressable
            onPress={() => set(tagged(week.load, nextPhase(phase)))}
            accessibilityRole="button"
            accessibilityLabel={t("plan.phaseWeek", { n: at + 1, phase: phaseText })}
            style={press({
              flex: 1,
              minHeight: 44,
              paddingHorizontal: 12,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              borderWidth: phase === undefined ? 1 : 0,
              borderStyle: "dashed",
              borderColor: colors.lineOnLightStrong,
              backgroundColor: phase === undefined ? undefined : PHASE_LOOK[phase].tint,
            })}
          >
            <Text
              numberOfLines={1}
              style={[
                type.bodyBold,
                {
                  fontSize: 14,
                  color: phase === undefined ? colors.textSecondary : PHASE_LOOK[phase].ink,
                },
              ]}
            >
              {phaseText}
            </Text>
          </Pressable>
        </View>
      </View>
      <LoadShapes onPick={(shape) => onChange(withShape(loads, shape))} />
    </SheetSection>
  );
}
