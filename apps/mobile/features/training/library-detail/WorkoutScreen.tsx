import React from "react";
import { LoadState } from "../data/LoadState";
import { useLibrary } from "../library/useLibrary";
import { WorkoutDetailScreen } from "../workout-detail/WorkoutDetailScreen";
import { LibraryWorkoutScreen } from "./LibraryWorkoutScreen";

export type WorkoutScreenProps = { id: string; grip?: string };

/** A library workout's screen: the hangboard one for hangboard workouts, the library one for the rest. */
export function WorkoutScreen({ id, grip }: WorkoutScreenProps): React.ReactElement | null {
  const { state, reload } = useLibrary();
  if (state.status !== "ready") return <LoadState state={state} onRetry={() => void reload()} />;
  const workout = state.data.workout(id);
  if (workout === undefined) return null;
  if (workout.category === "hang") return <WorkoutDetailScreen id={id} grip={grip} />;
  return <LibraryWorkoutScreen workout={workout} use={state.data.usage.get(id)} />;
}
