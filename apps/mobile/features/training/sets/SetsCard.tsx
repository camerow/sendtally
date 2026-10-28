import React from "react";
import { Text, View } from "react-native";
import {
  clock,
  type ItemDone,
  type SessionItem,
  type SetDone,
  type WeightUnit,
} from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { exerciseName } from "@sendtally/features/workouts";
import { Label } from "../components/Label";
import { LetterBadge } from "../components/LetterBadge";
import { type } from "../type";
import { SET_COLUMNS } from "./setColumns";
import { SetRow } from "./SetRow";
import { setKey, type SetAt } from "./setsRun";

export type SetsCardProps = {
  item: SessionItem;
  done: ItemDone;
  /** Each set as the last run of this workout did it. */
  previous: readonly SetDone[];
  lifting: boolean;
  ticked: ReadonlySet<string>;
  current: SetAt | null;
  unit: WeightUnit;
  onChange: (set: number, value: SetDone) => void;
  onToggle: (set: number) => void;
  /** What shows under a set: the rest its tick started, if it is running. */
  restUnder: (set: number) => React.ReactNode;
};

/** One exercise of the workout as a table of its sets, with its dose's letter when it alternates. */
export function SetsCard({
  item,
  done,
  previous,
  lifting,
  ticked,
  current,
  unit,
  onChange,
  onToggle,
  restUnder,
}: SetsCardProps): React.ReactElement {
  const name = exerciseName(item.exercise);
  const { sets: _, name: doseName, ...target } = item.dose;
  return (
    <View
      style={{
        gap: 4,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, paddingBottom: 4 }}>
        <Text style={[type.bodyBold, { flex: 1, fontSize: 17, color: colors.gunmetal }]}>
          {name}
        </Text>
        {item.turn !== undefined && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center" }}>
            <LetterBadge dose={item.turn} size={22} />
            {doseName !== undefined && (
              <Text style={[type.body, { fontSize: 13, color: colors.textSecondary }]}>
                {doseName}
              </Text>
            )}
          </View>
        )}
        {target.setRestS !== undefined && target.setRestS > 0 && (
          <Text style={[type.body, { fontSize: 13, color: colors.textSecondary }]}>
            {t("plan.chipRest", { value: clock(target.setRestS) })}
          </Text>
        )}
      </View>
      <View style={SET_COLUMNS.row}>
        <Label small color={colors.textSecondary} style={SET_COLUMNS.set}>
          {t("activities.colSet")}
        </Label>
        <Label small color={colors.textSecondary} style={SET_COLUMNS.target}>
          {t("activities.colTarget")}
        </Label>
        <Label small color={colors.textSecondary} style={SET_COLUMNS.done}>
          {t("activities.colDone")}
        </Label>
        <View style={SET_COLUMNS.tick} />
      </View>
      {done.sets.map((set, i) => (
        <React.Fragment key={i}>
          <SetRow
            n={i + 1}
            target={
              lifting ? { ...target, weightKg: target.weightKg ?? previous[i]?.weightKg } : target
            }
            done={set}
            previous={previous[i]}
            lifting={lifting}
            ticked={ticked.has(setKey({ item: done.item, set: i }))}
            current={current?.item === done.item && current.set === i}
            unit={unit}
            label={t("activities.setOf", { exercise: name, n: i + 1 })}
            onChange={(value) => onChange(i, value)}
            onToggle={() => onToggle(i)}
          />
          {restUnder(i)}
        </React.Fragment>
      ))}
    </View>
  );
}
