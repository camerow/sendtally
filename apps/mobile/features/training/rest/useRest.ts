import { useRest as useStoredRest, type RestClock } from "@sendtally/features/workouts";
import { liveRun } from "../../live-session/liveRun";

export { useRestLeft, type RestClock } from "@sendtally/features/workouts";

/**
 * The one rest a player runs at a time, kept with the live run so it outlasts the screen;
 * `useRestTone` plays its end.
 */
export const useRest = (): RestClock => useStoredRest(liveRun);
