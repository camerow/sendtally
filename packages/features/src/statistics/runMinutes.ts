import { hangSessionSeconds, type HangSession } from "@sendtally/core/hang";

type Part = Pick<HangSession, "gripId" | "protocol" | "done">;

/**
 * A run's minutes, split once: its fingerboard part's to Fingers, every grip and the rests
 * between them, and the rest of the run to its own kind.
 */
export function runMinutes(
  minutes: number,
  part: Part | undefined
): { fingers: number; rest: number } {
  const fingers =
    part === undefined ? 0 : Math.min(minutes, Math.round(hangSessionSeconds(part) / 60));
  return { fingers, rest: minutes - fingers };
}
