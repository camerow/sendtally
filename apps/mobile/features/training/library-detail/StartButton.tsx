import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import type { CalendarDate } from "@sendtally/core/hang";
import { eachSideOf, tallyMeasuresOf } from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { useExercises } from "@sendtally/features/statistics";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { startLibraryWorkout, type PlannedItems } from "./startLibraryWorkout";
import { usePlannedItems } from "./usePlannedItems";

export type StartButtonProps = {
  workout: LibraryWorkout;
  date: CalendarDate;
  /** What the plan prescribes; else the workout's next session as written. */
  planned?: PlannedItems;
  height: number;
  style?: StyleProp<ViewStyle>;
};

/** Start, which opens the workout's player; a climbing workout with no exercises logs its session instead. */
export function StartButton({
  workout,
  date,
  planned,
  height,
  style,
}: StartButtonProps): React.ReactElement {
  const exercises = useExercises(useApi()).state;
  const mine = exercises.status === "ready" ? exercises.data : [];
  const eachSide = eachSideOf(mine);
  const tally = tallyMeasuresOf(mine, workout.kind);
  const run = usePlannedItems(workout, planned);
  const climbing = workout.kind === "climbing" && run.items.length === 0;
  return (
    <Button
      label={climbing ? t("plan.logSession") : t("hang.start")}
      onPress={() => startLibraryWorkout(workout, date, run, eachSide, (e) => tally(e) !== null)}
      variant={climbing ? "gold" : "primary"}
      height={height}
      icon={climbing ? "plus" : "play"}
      style={style}
    />
  );
}
