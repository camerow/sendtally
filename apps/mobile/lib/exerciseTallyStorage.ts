import { draftStorage } from "@sendtally/features/log-session";

let held: string | null = null;

/**
 * The tally a workout's climbing exercises are logged on. It lives as long as the player that
 * runs the workout, which keeps nothing on disk either, and apart from the live session's file
 * so neither overwrites the other.
 */
export const exerciseTallyStorage = draftStorage({
  read: () => held,
  write: (value) => {
    held = value;
  },
  remove: () => {
    held = null;
  },
});
