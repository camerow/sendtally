/** A rest counting down under the row whose tick started it. */
export type Rest = {
  /** The row it shows under. */
  at: string;
  /** What it rests before, when that is another exercise. */
  next: string | null;
  seconds: number;
  endsAt: number;
};

export const MORE_REST_S = 30;

/**
 * The rest a tick starts, replacing any still running: a tick never waits for a rest,
 * and ticking early ends it. None without a rest to take.
 */
export const restAfter = (
  at: string,
  seconds: number,
  next: string | null,
  now: number
): Rest | null => (seconds > 0 ? { at, next, seconds, endsAt: now + seconds * 1000 } : null);

/** Whole seconds to go, zero once it is over. */
export const restLeft = (rest: Rest, now: number): number =>
  Math.max(0, Math.ceil((rest.endsAt - now) / 1000));

/** Thirty seconds more, on the clock and on the bar it drains. */
export const withMoreRest = (rest: Rest): Rest => ({
  ...rest,
  seconds: rest.seconds + MORE_REST_S,
  endsAt: rest.endsAt + MORE_REST_S * 1000,
});
