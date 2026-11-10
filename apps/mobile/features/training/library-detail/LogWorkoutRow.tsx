import React from "react";
import type { CalendarDate } from "@sendtally/core/hang";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { CategoryRow } from "../components/CategoryRow";
import { logLibraryWorkout } from "./startLibraryWorkout";
import { usePlannedItems } from "./usePlannedItems";

export type LogWorkoutRowProps = {
  workout: LibraryWorkout;
  dose: string | null;
  date: CalendarDate;
  onLogged: () => void;
};

/** A workout to log: a tap opens Log it's review with every set ticked. None for an empty workout. */
export function LogWorkoutRow({
  workout,
  dose,
  date,
  onLogged,
}: LogWorkoutRowProps): React.ReactElement | null {
  const run = usePlannedItems(workout);
  if (run.items.length === 0) return null;
  return (
    <CategoryRow
      kind={workout.kind}
      name={workout.name}
      meta={dose}
      onPress={() => {
        onLogged();
        logLibraryWorkout(workout, date, run);
      }}
    />
  );
}
