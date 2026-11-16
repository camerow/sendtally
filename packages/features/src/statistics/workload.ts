import { DAY_MS, dayStart } from "../trends/buckets";

export type Loadable = { at: number; rpe: number | null; minutes: number };

export type WorkloadZone = "light" | "sweet" | "caution" | "high";

export type Workload = {
  /** Load of the 7 days ending on the day. */
  acute: number;
  /** The 28 days ending on the day, as an average week. */
  chronic: number;
  /** `null` until 28 days of history, or when the 3 weeks before this one hold no load. */
  ratio: number | null;
  /** Records in the acute week with no RPE or no minutes, left out of the load. */
  leftOut: number;
  /** Days until the first ratio; 0 once there is enough history. */
  daysToGo: number;
};

const loadOf = (d: Loadable): number | null =>
  d.rpe === null || d.minutes <= 0 ? null : d.rpe * d.minutes;

const sum = (done: readonly Loadable[], from: number, to: number): number =>
  done.reduce((n, d) => (d.at >= from && d.at < to ? n + (loadOf(d) ?? 0) : n), 0);

/** Acute and chronic load and their ratio as of the end of `day`, a UTC day start. */
export function workloadOn(done: readonly Loadable[], day: number): Workload {
  const end = day + DAY_MS;
  const weekStart = end - 7 * DAY_MS;
  const monthStart = end - 28 * DAY_MS;
  const counted = done.filter((d) => loadOf(d) !== null && d.at < end);
  const first = counted.length === 0 ? null : Math.min(...counted.map((d) => d.at));
  const acute = sum(counted, weekStart, end);
  const before = sum(counted, monthStart, weekStart);
  const chronic = (acute + before) / 4;
  const daysToGo = first === null ? 28 : Math.max(0, 27 - (day - dayStart(first)) / DAY_MS);
  return {
    acute,
    chronic,
    ratio: daysToGo > 0 || before === 0 ? null : acute / chronic,
    leftOut: done.filter((d) => d.at >= weekStart && d.at < end && loadOf(d) === null).length,
    daysToGo,
  };
}

export function workloadZone(ratio: number): WorkloadZone {
  if (ratio < 0.8) return "light";
  if (ratio <= 1.3) return "sweet";
  if (ratio <= 1.5) return "caution";
  return "high";
}
