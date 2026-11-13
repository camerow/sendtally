import { useNavigate } from "react-router";
import type { CalendarDate } from "@sendtally/core/hang";
import { eachSideOf, tallyMeasuresOf } from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { useExercises } from "@sendtally/features/statistics";
import {
  runParams,
  useLiveRun,
  workoutStart,
  type LibraryWorkout,
  type PlannedItems,
} from "@sendtally/features/workouts";
import { useStartLive } from "../../live-session/useStartLiveSession";
import { runPath } from "../../live-session/startLive";
import { useAppApi } from "../../lib/useAppApi";
import { useLiveRunStore } from "../../lib/useLiveRun";

export type StartAction = { label: string; resume: boolean; onPress: () => void };

/**
 * Start for a workout the sets or checklist player runs, once whatever else is live is dealt
 * with; Resume while this workout is the run going. None for the other players.
 * ponytail: the hang timer and intervals players arrive with #291.
 */
export function useWorkoutStart(
  workout: LibraryWorkout,
  date: CalendarDate,
  planned: PlannedItems
): StartAction | null {
  const navigate = useNavigate();
  const startLive = useStartLive();
  const run = useLiveRun(useLiveRunStore());
  const exercises = useExercises(useAppApi()).state;
  if (run?.workoutId === workout.id)
    return { label: t("hang.resume"), resume: true, onPress: () => void navigate(runPath(run)) };
  if (exercises.status !== "ready") return null;
  const start = workoutStart(
    workout,
    date,
    planned,
    eachSideOf(exercises.data),
    tallyMeasuresOf(exercises.data, workout.kind)
  );
  if (start.open !== "sets" && start.open !== "checklist") return null;
  const to = runPath({ pathname: `/workout/${start.open}`, params: runParams(start.run) });
  return { label: t("hang.start"), resume: false, onPress: () => startLive(to) };
}
