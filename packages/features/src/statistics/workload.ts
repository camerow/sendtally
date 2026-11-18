import { DAY_MS, dayStart } from "../trends/buckets";

export type Loadable = { at: number; rpe: number | null; minutes: number };

export type WorkloadZone = "light" | "sweet" | "caution" | "high";

/**
 * What the day can say: a ratio; too much left out to trust one; under 28 days of history;
 * nothing counted in the three weeks before this one, where the ratio would always be 4.0;
 * or too few counted in the 28 days for the ratio to be more than a few fixed steps.
 */
export type WorkloadState = "ratio" | "partial" | "early" | "break" | "few";

export type Workload = {
  state: WorkloadState;
  /** Load of the 7 days ending on the day. */
  acute: number;
  /** The 28 days ending on the day, as an average week. */
  chronic: number;
  /** Acute over chronic whenever chronic has load, whatever the state. */
  ratio: number | null;
  /** The four 7-day loads ending on the day, oldest first. */
  weeks: [number, number, number, number];
  /** Records in the last 7 days, and how many were left out for no RPE or no minutes. */
  week: { total: number; leftOut: number };
  month: { total: number; leftOut: number };
  /** Days until the first ratio; 0 once there is enough history. */
  daysToGo: number;
};

/** Past this share of records left out, either window can be off by a whole zone. */
export const LEFT_OUT_LIMIT = 0.25;

/** Under about one a week, the ratio only takes a few values and swings between them. */
export const MIN_COUNTED = 4;

export const loadOf = (d: Loadable): number | null =>
  d.rpe === null || d.minutes <= 0 ? null : d.rpe * d.minutes;

function tally(done: readonly Loadable[], from: number, to: number) {
  const inside = done.filter((d) => d.at >= from && d.at < to);
  const loads = inside.map(loadOf);
  return {
    load: loads.reduce<number>((n, l) => n + (l ?? 0), 0),
    total: inside.length,
    leftOut: loads.filter((l) => l === null).length,
  };
}

const tooMuchLeftOut = ({ total, leftOut }: { total: number; leftOut: number }): boolean =>
  total > 0 && leftOut / total > LEFT_OUT_LIMIT;

/** Acute and chronic load and their ratio as of the end of `day`, a UTC day start. */
export function workloadOn(done: readonly Loadable[], day: number): Workload {
  const end = day + DAY_MS;
  const weekBack = (i: number): ReturnType<typeof tally> =>
    tally(done, end - (i + 1) * 7 * DAY_MS, end - i * 7 * DAY_MS);
  const now = weekBack(0);
  const all = tally(done, end - 28 * DAY_MS, end);
  const weeks: Workload["weeks"] = [weekBack(3).load, weekBack(2).load, weekBack(1).load, now.load];
  const acute = now.load;
  const chronic = all.load / 4;
  const counted = done.filter((d) => loadOf(d) !== null && d.at < end);
  const first = counted.length === 0 ? null : Math.min(...counted.map((d) => d.at));
  const daysToGo = first === null ? 28 : Math.max(0, 27 - (day - dayStart(first)) / DAY_MS);
  const week = { total: now.total, leftOut: now.leftOut };
  const month = { total: all.total, leftOut: all.leftOut };
  const state: WorkloadState =
    tooMuchLeftOut(week) || tooMuchLeftOut(month)
      ? "partial"
      : daysToGo > 0
        ? "early"
        : all.load === acute
          ? "break"
          : all.total - all.leftOut < MIN_COUNTED
            ? "few"
            : "ratio";
  return {
    state,
    acute,
    chronic,
    ratio: chronic === 0 ? null : acute / chronic,
    weeks,
    week,
    month,
    daysToGo,
  };
}

export function workloadZone(ratio: number): WorkloadZone {
  if (ratio < 0.8) return "light";
  if (ratio <= 1.3) return "sweet";
  if (ratio <= 1.5) return "caution";
  return "high";
}
