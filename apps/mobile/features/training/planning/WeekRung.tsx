import React from "react";
import { Pressable, Text, View } from "react-native";
import type { Dose, SessionItem, WeightUnit, WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { weekChips } from "@sendtally/features/training";
import { doseSummary, exerciseName } from "@sendtally/features/workouts";
import { pressRow } from "../../../lib/press";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { type } from "../type";
import { RungEditor } from "./RungEditor";
import { WeekChipRow } from "./WeekChipRow";

export type WeekRungProps = {
  kind: WorkoutKind;
  week: number;
  items: readonly SessionItem[];
  /** This week's change to each item, empty where it runs as written. */
  changes: readonly Partial<Dose>[];
  unit: WeightUnit;
  open: boolean;
  onToggle: () => void;
  onChange: (item: number, change: Partial<Dose>) => void;
};

/** One week of a workout in a block: what it changes, opening in place to change it. */
export function WeekRung({
  kind,
  week,
  items,
  changes,
  unit,
  open,
  onToggle,
  onChange,
}: WeekRungProps): React.ReactElement {
  const several = items.length > 1;
  const chipsOf = (i: number): ReturnType<typeof weekChips> =>
    weekChips(kind, items[i]?.dose ?? { sets: 1 }, changes[i] ?? {}, unit).map((c) =>
      several ? { ...c, text: `${exerciseName(items[i]?.exercise ?? "")} ${c.text}` } : c
    );
  const chips = items.flatMap((_, i) => chipsOf(i));
  const [only] = items;
  return (
    <View
      style={{
        borderRadius: 14,
        borderWidth: 1,
        borderColor: open ? colors.gunmetal : colors.lineOnLight,
        backgroundColor: open ? colors.surfaceSoft : undefined,
      }}
    >
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={t("plan.weekAria", {
          n: week,
          changes: chips.length === 0 ? t("plan.asWritten") : chips.map((c) => c.text).join(", "),
        })}
        style={pressRow({ flexDirection: "row", alignItems: "center", gap: 12, padding: 12 })}
      >
        <Label color={colors.gunmetal} style={{ width: 34 }}>
          {t("plan.weekShort", { n: week })}
        </Label>
        <View style={{ flex: 1 }}>
          <WeekChipRow chips={chips} />
        </View>
        {!several && only !== undefined && (
          <Text style={[type.mono, { fontSize: 11, color: colors.textSecondary, maxWidth: "40%" }]}>
            {doseSummary(kind, { ...only.dose, ...changes[0] }, unit)}
          </Text>
        )}
      </Pressable>
      {open && (
        <View style={{ gap: 16, paddingHorizontal: 12, paddingBottom: 12 }}>
          {items.map((item, i) => (
            <View key={i} style={{ gap: 8 }}>
              {several && (
                <Text style={[type.bodyBold, { fontSize: 14, color: colors.gunmetal }]}>
                  {exerciseName(item.exercise)}
                </Text>
              )}
              <RungEditor
                kind={kind}
                item={item}
                change={changes[i] ?? {}}
                unit={unit}
                onChange={(change) => onChange(i, change)}
              />
            </View>
          ))}
          {chips.length > 0 && (
            <Button
              label={t("plan.resetWeek")}
              onPress={() =>
                changes.forEach((c, i) => {
                  if (Object.keys(c).length > 0) onChange(i, {});
                })
              }
              variant="link"
              height={40}
            />
          )}
        </View>
      )}
    </View>
  );
}
