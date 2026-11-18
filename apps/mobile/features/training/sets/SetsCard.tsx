import React from "react";
import { View, useWindowDimensions } from "react-native";
import {
  type ItemDone,
  type SessionItem,
  type SetDone,
  type WeightUnit,
} from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { exerciseName } from "@sendtally/features/workouts";
import { useFieldOrder } from "../../../components/useFieldOrder";
import type { About } from "../components/AboutButton";
import { Button } from "../components/Button";
import type { DetailMenuRow } from "../components/types";
import { Label } from "../components/Label";
import { RestPreview } from "../rest/RestPreview";
import { SET_COLUMNS } from "./setColumns";
import { ExerciseCardHead } from "./ExerciseCardHead";
import { SetRow } from "./SetRow";
import { setKey, type SetAt } from "@sendtally/features/workouts";

export type SetsCardProps = {
  item: SessionItem;
  done: ItemDone;
  /** What each set asks. */
  target: (set: number) => SetDone;
  /** Each set as the last run of this workout did it. */
  previous: readonly SetDone[];
  lifting: boolean;
  ticked: ReadonlySet<string>;
  current: SetAt | null;
  unit: WeightUnit;
  onChange: (set: number, value: SetDone) => void;
  onToggle: (set: number) => void;
  /** A set running on its timer, in place of its row. */
  holdRow: (set: number) => React.ReactNode;
  /** ▶ for a set, when it is the current one and timed. */
  go: (set: number) => React.ReactNode;
  /** What shows under a set: the rest its tick started, if it is running, else its rest to come. */
  restUnder: (set: number) => React.ReactNode;
  /** The exercise's description behind an info button beside its name; none without one. */
  about?: About | undefined;
  onFocus: (set: number) => void;
  onRemoveSet: (set: number) => void;
  onAddSet: () => void;
  /** Its title folds it. */
  onFold: () => void;
  /** Its ··· menu: skip, move, remove. */
  menu: readonly DetailMenuRow[];
};

/** One exercise of the workout as a table of its sets, with its dose's letter when it alternates. */
export function SetsCard({
  item,
  done,
  target: targetOf,
  previous,
  lifting,
  ticked,
  current,
  unit,
  onChange,
  onToggle,
  holdRow,
  go,
  restUnder,
  about,
  onFocus,
  onRemoveSet,
  onAddSet,
  onFold,
  menu,
}: SetsCardProps): React.ReactElement {
  const tight = useWindowDimensions().width < 360;
  const name = exerciseName(item.exercise);
  const { setRestS, targetRpe } = item.dose;
  const rated = targetRpe !== undefined;
  const tickedSets = done.sets.flatMap((_, i) =>
    ticked.has(setKey({ item: done.item, set: i })) ? [String(i)] : []
  );
  const rpeOrder = useFieldOrder(tickedSets);
  return (
    <View
      style={{
        gap: 4,
        padding: 14,
        paddingTop: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
      }}
    >
      <ExerciseCardHead item={item} about={about} onFold={onFold} menu={menu} />
      <View style={SET_COLUMNS.row}>
        <Label small color={colors.textSecondary} style={SET_COLUMNS.set}>
          {t("activities.colSet")}
        </Label>
        <Label small color={colors.textSecondary} style={SET_COLUMNS.target}>
          {tight ? "" : t("activities.colTarget")}
        </Label>
        <Label small color={colors.textSecondary} style={SET_COLUMNS.done}>
          {rated && lifting ? t("activities.colDoneUnit", { unit }) : t("activities.colDone")}
        </Label>
        {rated && (
          <Label small color={colors.textSecondary} style={SET_COLUMNS.rpe}>
            RPE
          </Label>
        )}
        <View style={SET_COLUMNS.tick} />
        <View style={SET_COLUMNS.remove} />
      </View>
      {done.sets.map((set, i) => (
        <React.Fragment key={i}>
          {holdRow(i) || (
            <SetRow
              n={i + 1}
              repsMax={item.dose.repsMax}
              target={targetOf(i)}
              done={set}
              previous={previous[i]}
              lifting={lifting}
              ticked={ticked.has(setKey({ item: done.item, set: i }))}
              current={current?.item === done.item && current.set === i}
              unit={unit}
              label={t("activities.setOf", { exercise: name, n: i + 1 })}
              onChange={(value) => onChange(i, value)}
              onToggle={() => onToggle(i)}
              onFocus={() => onFocus(i)}
              onRemove={() => onRemoveSet(i)}
              testID={`set-row-${done.item}-${i}`}
              go={go(i) || undefined}
              {...(rated && { rpe: { slot: rpeOrder.slot(String(i)), target: targetRpe } })}
            />
          )}
          {restUnder(i) ||
            (i < done.sets.length - 1 && setRestS !== undefined && setRestS > 0 && (
              <RestPreview seconds={setRestS} />
            ))}
        </React.Fragment>
      ))}
      <View style={{ flexDirection: "row", paddingTop: 6 }}>
        <Button
          label={t("activities.addSet")}
          accessibilityLabel={t("activities.addSetTo", { exercise: name })}
          onPress={onAddSet}
          variant="outline"
          icon="plus"
          height={40}
        />
      </View>
    </View>
  );
}
