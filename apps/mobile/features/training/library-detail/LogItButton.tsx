import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import type { CalendarDate } from "@sendtally/core/hang";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { Button } from "../components/Button";
import { logLibraryWorkout, type PlannedItems } from "./startLibraryWorkout";
import { usePlannedItems } from "./usePlannedItems";

export type LogItButtonProps = {
  workout: LibraryWorkout;
  date: CalendarDate;
  label: string;
  /** What the plan prescribes; else the workout's next session as written. */
  planned?: PlannedItems;
  /** The grip a hangboard workout logs on, when picked. */
  gripId?: string;
  height: number;
  style?: StyleProp<ViewStyle>;
};

/** Log it, without the timer: the review with every set ticked. None for a workout with nothing in it. */
export function LogItButton({
  workout,
  date,
  label,
  planned,
  gripId,
  height,
  style,
}: LogItButtonProps): React.ReactElement | null {
  const run = usePlannedItems(workout, planned);
  if (run.items.length === 0) return null;
  return (
    <Button
      label={label}
      onPress={() => logLibraryWorkout(workout, date, run, gripId)}
      variant="outline"
      height={height}
      style={style}
    />
  );
}
