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
import { exerciseName, exerciseTargetLine } from "@sendtally/features/workouts";
import { useFieldOrder } from "../../../components/useFieldOrder";
import { AboutButton, type About } from "../components/AboutButton";
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
  /** Under the sets, such as one more to add. */
  footer?: React.ReactNode;
  /** The exercise's description behind an info button beside its name; none without one. */
  about?: About | undefined;
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
  footer,
  about,
}: SetsCardProps): React.ReactElement {
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
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
      }}
    >
      <View style={{ gap: 2, paddingBottom: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={[type.bodyBold, { flexShrink: 1, fontSize: 17, color: colors.gunmetal }]}>
              {name}
            </Text>
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
          {t("activities.colTarget")}
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
      {footer}
    </View>
  );
}
