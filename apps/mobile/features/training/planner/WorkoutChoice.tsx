import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { totalSeconds, type Workout } from "@sendtally/core/hang";
import { humanDuration, protocolSummary } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Button } from "../components/Button";
import { SheetSection } from "../components/SheetSection";
import { useHangData } from "../data/HangDataContext";
import { type } from "../type";
import type { Planner } from "./usePlanner";

const mineFirst = (a: Workout, b: Workout): number =>
  a.source === b.source ? 0 : a.source === "mine" ? -1 : 1;

export type WorkoutChoiceProps = { planner: Planner; onNew: () => void };

/** The workout to plan: all of them while picking, mine first, and a way to build a new one. */
export function WorkoutChoice({ planner, onNew }: WorkoutChoiceProps): React.ReactElement {
  const { model } = useHangData();
  const { workout, isEdit } = planner;
  const rows = workout === undefined ? [...model.workouts].sort(mineFirst) : [workout];
  const canChange = !isEdit && workout !== undefined;
  return (
    <SheetSection
      label={t("hang.workout")}
      aside={
        canChange && (
          <Button
            label={t("hang.change")}
            onPress={() => planner.update({ picking: true })}
            variant="link"
            height={32}
          />
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
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            style={{
              minHeight: 56,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 12,
              borderWidth: on ? 0 : 1,
              borderColor: colors.lineOnLight,
              backgroundColor: on ? colors.surfaceSoft : undefined,
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: colors.gunmetal,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {on && (
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: colors.gunmetal,
                  }}
                />
              )}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>
                {w.name}
              </Text>
              <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>{meta}</Text>
            </View>
          </Pressable>
        );
      })}
      {workout === undefined && (
        <Button
          label={t("plan.newWorkout")}
          onPress={onNew}
          variant="dashed"
          icon="plus"
          height={50}
        />
      )}
    </SheetSection>
  );
}
