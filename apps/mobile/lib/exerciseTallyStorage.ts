import { userDraftFile } from "./userDraftFile";

/**
 * The tally a workout's climbing exercises are logged on, kept on disk with the live run so an
 * app kill or an update keeps the climbs, and apart from the live session's file so neither
 * overwrites the other.
 */
export const exerciseTallyStorage = userDraftFile("workout-tally");
