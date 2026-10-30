import React from "react";
import { Text, View } from "react-native";
import {
  clock,
  doseIndex,
  intervalsOf,
  sessionItems,
  turnsOf,
  type Dose,
  type WeightUnit,
} from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { climbingDoseLine } from "@sendtally/features/activities";
import type { TallyMeasure } from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import {
  bodySummary,
  doseSummary,
  exerciseName,
  letterName,
  turnName,
  type LibraryWorkout,
} from "@sendtally/features/workouts";
import { DashedPanel } from "../components/DashedPanel";
import { IntervalsBar } from "../components/IntervalsBar";
import { Label } from "../components/Label";
import { LetterBadge } from "../components/LetterBadge";
import { type } from "../type";
import { PreviewRow } from "./PreviewRow";
import { RestDivider } from "./RestDivider";

export type BodyPreviewProps = {
  workout: LibraryWorkout;
  unit: WeightUnit;
  /** How many sessions of it are logged: which dose each item takes next. */
  session: number;
  /** How an item's exercise logs on the climbing tally, as the player reads its dose. */
  tally: (exercise: string) => TallyMeasure | null;
  /** Where tapping an item goes: its exercise, when it has a screen. */
  openExercise?: (name: string) => (() => void) | undefined;
};

/**
 * What the workout's next session holds, read only: each item and what it asks for, the
 * rests where they fall, and, when items alternate, what each takes the session after.
 */
export function BodyPreview({
  workout,
  unit,
  session,
  tally,
  openExercise,
}: BodyPreviewProps): React.ReactElement {
  if (bodySummary(workout) === null) return <DashedPanel body={t("workouts.noBody")} />;
  const turns = turnsOf(workout.items);
  const items = sessionItems(workout.items, session);
  const timed = items.every((item) => item.dose.onS !== undefined);
  const restOf = (seconds: number | undefined): string | undefined =>
    seconds === undefined || seconds === 0
      ? undefined
      : t("plan.chipRest", { value: clock(seconds) });
  const doseText = (exercise: string, dose: Dose): string => {
    const measure = tally(exercise);
    return measure === null
      ? doseSummary(workout.kind, dose, unit)
      : climbingDoseLine(dose, measure);
  };
  const noteOf = (i: number): string | undefined => {
    const item = workout.items[i];
    if (turns === 1 || item === undefined) return undefined;
    if (item.doses.length === 1) return t("workouts.sameEverySession");
    const next = doseIndex(item, session + 1);
    const dose = item.doses[next];
    return dose === undefined
      ? undefined
      : t("workouts.alternatesWith", {
          letter: letterName(next, dose.name),
          dose: doseText(item.exercise, dose),
        });
  };
  return (
    <View style={{ gap: 4 }}>
      {turns > 1 && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Label color={colors.gunmetal} style={{ flex: 1 }}>
            {t("workouts.nextSession")}
          </Label>
          <LetterBadge dose={session % turns} size={26} />
          <Text style={[type.body, { fontSize: 13, color: colors.textSecondary }]}>
            {[
              turnName(workout.items, session),
              t("workouts.thenLetter", {
                letter: letterName((session + 1) % turns, turnName(workout.items, session + 1)),
              }),
            ]
              .filter((x) => x !== undefined)
              .join(" ")}
          </Text>
        </View>
      )}
      {timed && workout.kind !== "hangboard" && (
        <View style={{ flexDirection: "row", paddingVertical: 8 }}>
          <IntervalsBar intervals={intervalsOf(items)} height={14} />
        </View>
      )}
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && workout.exerciseRestS > 0 && (
            <RestDivider label={restOf(workout.exerciseRestS) ?? ""} />
          )}
          <PreviewRow
            title={exerciseName(item.exercise)}
            detail={doseText(item.exercise, item.dose)}
            note={noteOf(i)}
            rest={workout.kind === "hangboard" ? undefined : restOf(item.dose.setRestS)}
            onPress={openExercise?.(item.exercise)}
          />
        </React.Fragment>
      ))}
    </View>
  );
}
