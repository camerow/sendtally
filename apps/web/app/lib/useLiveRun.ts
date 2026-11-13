import { useAuth } from "@clerk/react-router";
import type { DraftStorage } from "@sendtally/features/log-session";
import { liveRunStore, type LiveRunStore } from "@sendtally/features/workouts";
import { localStore } from "./localStorages";

const runs = new Map<string, { store: LiveRunStore; tally: DraftStorage }>();

/** One user's live workout run and the tally its climbing items log on, shared by every reader. */
export function liveRunOf(userId: string): { store: LiveRunStore; tally: DraftStorage } {
  const known = runs.get(userId);
  if (known !== undefined) return known;
  const tally = localStore(`sendtally:exercise-tally:${userId}`);
  const made = { store: liveRunStore(localStore(`sendtally:live-run:${userId}`), tally), tally };
  runs.set(userId, made);
  return made;
}

/** The signed-in user's live run store. */
export const useLiveRunStore = (): LiveRunStore => liveRunOf(useAuth().userId ?? "").store;

/** The signed-in user's workout tally, where a run's climbing items log. */
export const useExerciseTallyStorage = (): DraftStorage => liveRunOf(useAuth().userId ?? "").tally;
