import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import type { CalendarDate } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { Button } from "../components/Button";
import { startLibraryWorkout, type PlannedItems } from "./startLibraryWorkout";

export type StartButtonProps = {
  workout: LibraryWorkout;
  date: CalendarDate;
  planned?: PlannedItems;
  height: number;
  style?: StyleProp<ViewStyle>;
};

/** Start, which opens the workout's player; a climbing workout logs its session instead. */
export function StartButton({
  workout,
  date,
  planned,
  height,
  style,
}: StartButtonProps): React.ReactElement {
  const climbing = workout.kind === "climbing";
  return (
    <Button
      label={climbing ? t("plan.logSession") : t("hang.start")}
      onPress={() => startLibraryWorkout(workout, date, planned)}
      variant={climbing ? "gold" : "primary"}
      height={height}
      icon={climbing ? "plus" : "play"}
      style={style}
    />
  );
}
