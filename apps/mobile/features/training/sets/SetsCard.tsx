import React from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import {
  clock,
  type ItemDone,
  type SessionItem,
  type SetDone,
  type WeightUnit,
} from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { exerciseName, exerciseTargetLine } from "@sendtally/features/workouts";
import { Icon } from "../../../components/Icon";
import { useFieldOrder } from "../../../components/useFieldOrder";
import { press } from "../../../lib/press";
import { AboutButton, type About } from "../components/AboutButton";
import { Button } from "../components/Button";
import { DetailMenu } from "../components/DetailMenu";
import type { DetailMenuRow } from "../components/types";
import { Label } from "../components/Label";
import { LetterBadge } from "../components/LetterBadge";
import { RestPreview } from "../rest/RestPreview";
import { type } from "../type";
import { SET_COLUMNS } from "./setColumns";
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
  const { name: doseName, setRestS, targetRpe } = item.dose;
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
      <View style={{ gap: 2, paddingBottom: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Pressable
              onPress={onFold}
              accessibilityRole="button"
              accessibilityLabel={t("workouts.foldExercise", { name })}
              accessibilityState={{ expanded: true }}
              hitSlop={{ top: 12, bottom: 12 }}
              style={press({
                flexShrink: 1,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              })}
            >
              <Text
                style={[type.bodyBold, { flexShrink: 1, fontSize: 17, color: colors.gunmetal }]}
              >
                {name}
              </Text>
              <View style={{ transform: [{ rotate: "-90deg" }] }}>
                <Icon name="chevron" size={16} strokeWidth={2} color={colors.textMuted} />
              </View>
            </Pressable>
            <AboutButton
              about={about}
              label={t("workouts.aboutExercise")}
              color={colors.textMuted}
            />
          </View>
          {item.turn !== undefined && (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center" }}
            >
              <LetterBadge dose={item.turn} size={22} />
              {doseName !== undefined && (
                <Text style={[type.body, { fontSize: 13, color: colors.textSecondary }]}>
                  {doseName}
                </Text>
              )}
            </View>
          )}
          {setRestS !== undefined && setRestS > 0 && (
            <Text style={[type.body, { fontSize: 13, color: colors.textSecondary }]}>
              {t("plan.chipRest", { value: clock(setRestS) })}
            </Text>
          )}
          <View style={{ alignSelf: "center", marginVertical: -8 }}>
            <DetailMenu
              rows={menu}
              button={{
                label: t("workouts.exerciseMore"),
                color: colors.textSecondary,
                size: 36,
                iconSize: 20,
              }}
            />
          </View>
        </View>
        {rated && (
          <Text style={[type.body, { fontSize: 13, color: colors.textSecondary }]}>
            {exerciseTargetLine(item.dose)}
          </Text>
        )}
      </View>
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
