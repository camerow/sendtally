import {
  typicalGradeIndex,
  useClimbVocabulary,
  type ClimbVocabulary,
} from "@sendtally/features/climbs";
import { useGyms, type Gym } from "@sendtally/features/gyms";
import {
  useTally,
  type GradePrefs,
  type LiveSession,
  type Tally,
} from "@sendtally/features/log-session";
import { queries, useQuery } from "@sendtally/features/query";
import { useGradeScalePrefs } from "@sendtally/features/settings";
import type { RestClock } from "@sendtally/features/workouts";
import { climbKindStorage } from "../../lib/localStorages";
import { useAppApi } from "../../lib/useAppApi";

/** The workout's tally for its climbing cards, resting on the player's clock. */
export function useWorkoutTally(
  live: LiveSession,
  rest: RestClock
): Tally & { vocabulary: ClimbVocabulary; scales: GradePrefs; gyms: readonly Gym[] } {
  const api = useAppApi();
  const gyms = useGyms(api);
  const vocabulary = useClimbVocabulary(api);
  const { scales } = useGradeScalePrefs(api);
  const sessions = useQuery(queries.sessions(api)).state;
  const tally = useTally({
    live,
    rest,
    exercise: true,
    gyms: gyms.gyms,
    settled: sessions.status !== "loading" && gyms.state.status !== "loading",
    lastGymId:
      sessions.status === "ready"
        ? (sessions.data.sessions.find((s) => s.gym_id !== null)?.gym_id ?? undefined)
        : undefined,
    scales,
    kindStorage: climbKindStorage,
    typicalIndex: (scale) => typicalGradeIndex(vocabulary.climbs, scale),
  });
  return { ...tally, vocabulary, scales, gyms: gyms.gyms };
}
