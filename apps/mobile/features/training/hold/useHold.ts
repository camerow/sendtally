import { useHold as useStoredHold, type Hold, type HoldClock } from "@sendtally/features/workouts";
import { liveRun } from "../../live-session/liveRun";

/**
 * The live run's hold, with the time it is read at kept current; `onOver` hears when it reaches
 * its target, for the player to record it.
 */
export const useHold = (onOver?: (hold: Hold) => void): HoldClock => useStoredHold(liveRun, onOver);
