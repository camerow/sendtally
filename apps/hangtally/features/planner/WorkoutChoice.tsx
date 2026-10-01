import React from "react";
import { Pressable, Text, View } from "react-native";
import { totalSeconds, type Workout } from "@sendtally/core/hang";
import { humanDuration, kindLabel, protocolSummary } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { KindTag } from "../../components/KindTag";
import { Label } from "../../components/Label";
import { SheetSection } from "../../components/SheetSection";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";
import { useHangData } from "../data/HangDataContext";
import type { Planner } from "./usePlanner";

const mineFirst = (a: Workout, b: Workout): number =>
  a.source === b.source ? 0 : a.source === "mine" ? -1 : 1;

export function WorkoutChoice({ planner }: { planner: Planner }): React.ReactElement {
  const c = useTheme();
  const { model } = useHangData();
  const { workout, isEdit } = planner;
  const rows = workout === undefined ? [...model.workouts].sort(mineFirst) : [workout];
  const canChange = !isEdit && workout !== undefined;
  return (
    <SheetSection
      label={t("hang.workout")}
      aside={
        canChange && (
          <Pressable
            onPress={() => planner.update({ picking: true })}
            accessibilityRole="button"
            hitSlop={12}
          >
            <Label color={c.ink} style={{ textDecorationLine: "underline" }}>
              {t("hang.change")}
            </Label>
          </Pressable>
        )
      }
    >
      {rows.map((w) => {
        const on = w.id === workout?.id;
        const meta = [
          humanDuration(totalSeconds(w)),
          protocolSummary(w, w.timeUnits).split(" · ")[0],
          ...(w.source === "mine" ? [t("hang.yours")] : []),
        ].join(" · ");
        return (
          <Pressable
            key={w.id}
            onPress={() => !isEdit && planner.pickWorkout(w)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={{
              minHeight: 58,
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 14,
              borderWidth: on ? 2 : 1,
              borderColor: on ? c.ink : c.lineLight,
              backgroundColor: on ? c.soft : undefined,
            }}
          >
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[type.bodyBold, { fontSize: 16, color: c.ink }]}>{w.name}</Text>
              <Label small color={c.ink2}>
                {meta}
              </Label>
            </View>
            <KindTag kind={w.kind} label={kindLabel(w.kind)} small />
          </Pressable>
        );
      })}
    </SheetSection>
  );
}
