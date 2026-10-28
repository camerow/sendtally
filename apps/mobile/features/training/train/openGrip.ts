import { router } from "expo-router";
import { byDate, type HangSession } from "@sendtally/core/hang";

/** Opens the workout a grip was last hung on with that grip; nothing when it never was. */
export function openGrip(
  sessions: readonly HangSession[],
  gripId: string
): (() => void) | undefined {
  const last = sessions
    .filter((s) => s.gripId === gripId)
    .sort(byDate)
    .at(-1);
  return last === undefined
    ? undefined
    : () =>
        router.push({ pathname: "/workout/[id]", params: { id: last.workoutId, grip: gripId } });
}
