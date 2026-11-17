import type { Exercise, SendtallyApi } from "@sendtally/api-client";
import { useExercises } from "../statistics/useExercises";

const NONE: Exercise[] = [];

/** The user's exercises once loaded, none before. */
export function useExerciseList(api: SendtallyApi): Exercise[] {
  const state = useExercises(api).state;
  return state.status === "ready" ? state.data : NONE;
}
