export const COUNT_IN_S = 3;
export const SWITCH_S = 5;

/** A timed set or line counting up in its own row, kept with the live run. */
export type Hold = {
  /** The row it runs in. */
  at: string;
  /** Its exercise, for the strip while the player is minimised. */
  name: string;
  targetS: number;
  /** Left then right in one run, with a switch between. */
  sides: boolean;
  /** When the hold reads 0:00, after the count-in; every pause moves it on. */
  zeroAt: number;
  pausedAt: number | null;
};

export type HoldNow =
  | { phase: "countIn"; left: number }
  | { phase: "hold"; side: "L" | "R" | null; seconds: number; share: number }
  | { phase: "switch"; left: number }
  | { phase: "over" };

/** A tap on ▶: three seconds to get into position, then it counts. */
export const startHold = (
  at: string,
  name: string,
  targetS: number,
  sides: boolean,
  now: number
): Hold => ({ at, name, targetS, sides, zeroAt: now + COUNT_IN_S * 1000, pausedAt: null });

/** When it reaches its target, both sides and the switch included. */
export const holdEndsAt = (h: Hold): number =>
  h.zeroAt + (h.sides ? 2 * h.targetS + SWITCH_S : h.targetS) * 1000;

/** Where the hold is: counting in, on a side, switching, or over. */
export function holdNow(h: Hold, now: number): HoldNow {
  const ms = (h.pausedAt ?? now) - h.zeroAt;
  if (ms < 0) return { phase: "countIn", left: Math.ceil(-ms / 1000) };
  const s = ms / 1000;
  const on = (side: "L" | "R" | null, from: number): HoldNow => ({
    phase: "hold",
    side,
    seconds: Math.floor(s - from),
    share: (s - from) / h.targetS,
  });
  if (!h.sides) return s < h.targetS ? on(null, 0) : { phase: "over" };
  if (s < h.targetS) return on("L", 0);
  if (s < h.targetS + SWITCH_S)
    return { phase: "switch", left: Math.ceil(h.targetS + SWITCH_S - s) };
  if (s < 2 * h.targetS + SWITCH_S) return on("R", h.targetS + SWITCH_S);
  return { phase: "over" };
}

/**
 * What Done records now: the time held, the shorter side once both have run, the target once
 * it is over. None during the count-in, which Done only cancels.
 */
export function heldSeconds(h: Hold, now: number): number | null {
  const at = holdNow(h, now);
  if (at.phase === "countIn") return null;
  if (at.phase === "hold") return at.seconds;
  return h.targetS;
}

export const pauseHold = (h: Hold, now: number): Hold =>
  h.pausedAt === null ? { ...h, pausedAt: now } : h;

export const resumeHold = (h: Hold, now: number): Hold =>
  h.pausedAt === null ? h : { ...h, zeroAt: h.zeroAt + now - h.pausedAt, pausedAt: null };
