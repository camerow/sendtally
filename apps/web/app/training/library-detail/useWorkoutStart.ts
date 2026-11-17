import { useNavigate } from "react-router";
import type { CalendarDate } from "@sendtally/core/hang";
import { eachSideOf, tallyMeasuresOf } from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { useExercises } from "@sendtally/features/statistics";
import { planLinkParams } from "@sendtally/features/training";
import {
  activityFormParams,
  playerRoute,
  useLiveRun,
  workoutStart,
  type LibraryWorkout,
  type PlannedItems,
} from "@sendtally/features/workouts";
import { useStartLive } from "../../live-session/useStartLiveSession";
import { LIVE_PATH, runPath } from "../../live-session/startLive";
import { useAppApi } from "../../lib/useAppApi";
import { newActivityPath } from "../log/paths";
import { useLiveRunStore } from "../../lib/useLiveRun";

export type StartAction = { label: string; resume: boolean; onPress: () => void };

/**
 * Start for a workout one of the players runs, or the live session a climbing day with no
 * exercises opens, once whatever else is live is dealt with; Resume while this workout is the
 * run going. A workout with nothing to run opens its review, as on mobile. From the workout's own
 * page, the run takes its place.
 */
export function useWorkoutStart(
  workout: LibraryWorkout,
  date: CalendarDate,
  planned: PlannedItems,
  ownPage = false
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
  if (start.open === "liveSession") {
    const { link } = planned;
    const params = new URLSearchParams({
      ...(link.membershipId === null ? {} : planLinkParams(link)),
      name: workout.name,
    });
    return {
      label: t("hang.start"),
      resume: false,
      onPress: () => startLive(`${LIVE_PATH}?${params}`, ownPage),
    };
  }
  if (start.open === "form") {
    const to = newActivityPath({
      ...activityFormParams(start.run),
      session: String(planned.session),
    });
    return {
      label: t("hang.start"),
      resume: false,
      onPress: () => void navigate(to, { replace: ownPage }),
    };
  }
  const route = playerRoute(workout, start, planned);
  if (route === null) return null;
  return {
    label: t("hang.start"),
    resume: false,
    onPress: () => startLive(runPath(route), ownPage),
  };
}
