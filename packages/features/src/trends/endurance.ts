import type { Endurance } from "@sendtally/core";
import type { CircuitColour, SessionWithClimbs } from "@sendtally/api-client";
import { climbKey } from "../climbs/transforms";
import { formatNumber, t } from "../i18n";
import { enduranceAmountLabel } from "../log-session/endurance";
import { bucketsFor, rangeLabel, windowOf } from "./buckets";
import { ALL_LADDER } from "./slice";
import { delta, formatter, pointsOver, tile } from "./tile";
import { type EnduranceCircuitVM, type EnduranceVM, type TrendRange } from "./types";

type Set_ = {
  time: number;
  key: string;
  label: string;
  colour: CircuitColour | null;
  e: Endurance;
};

type Tally = { sets: number; laps: number; clean: number; moves: number; rate: number | null };

function tally(sets: Set_[]): Tally {
  let laps = 0;
  let clean = 0;
  let moves = 0;
  for (const { e } of sets) {
    laps += e.laps.length;
    clean += e.laps.filter((l) => l === e.target).length;
    if (e.unit === "moves") moves += e.laps.reduce((a, b) => a + b, 0);
  }
  return { sets: sets.length, laps, clean, moves, rate: laps === 0 ? null : (clean / laps) * 100 };
}

/** A circuit is the same one when it is on the same gym circuit, or has the same name and length. */
function setsOf(sessions: SessionWithClimbs[]): Set_[] {
  return sessions.flatMap((s) =>
    s.climbs.flatMap((c) => {
      const e = c.endurance;
      if (e === undefined) return [];
      const name = c.name.trim();
      const length = enduranceAmountLabel(e, e.target);
      const key =
        c.circuit?.id ??
        (climbKey(name) === ""
          ? `${e.unit}:${e.target}`
          : `${climbKey(name)}:${e.unit}:${e.target}`);
      return [
        {
          time: Date.parse(c.time),
          key,
          label: name !== "" ? name : (c.circuit?.label ?? length),
          colour: c.circuit?.colour ?? null,
          e,
        },
      ];
    })
  );
}

const MAX_CURVE_LAPS = 8;

function bestRun(sets: Set_[]): number {
  let best = 0;
  for (const { e } of sets) {
    let run = 0;
    for (const lap of e.laps) {
      run = lap === e.target ? run + 1 : 0;
      best = Math.max(best, run);
    }
  }
  return best;
}

export function enduranceVM(
  sessions: SessionWithClimbs[],
  range: TrendRange,
  now: Date = new Date()
): EnduranceVM {
  const all = setsOf(sessions).sort((a, b) => a.time - b.time);
  const buckets = bucketsFor(range, now, all[0]?.time ?? null);
  const { start, end } = windowOf(buckets);
  const inRange = all.filter((s) => s.time >= start && s.time < end);
  const cur = tally(inRange);
  const prior =
    range === "all"
      ? null
      : tally(all.filter((s) => s.time >= start - (end - start) && s.time < start));
  const per = buckets.map((b) => tally(inRange.filter((s) => s.time >= b.start && s.time < b.end)));
  const label = rangeLabel(range);
  const ladder = ALL_LADDER;
  const pct = formatter("pct", ladder);
  const count = formatter("count", ladder);

  const deepest = Math.min(MAX_CURVE_LAPS, Math.max(0, ...inRange.map((s) => s.e.laps.length)));
  const curve = Array.from({ length: deepest }, (_, n) => {
    const ratios = inRange
      .filter((s) => s.e.laps.length > n)
      .map((s) => (s.e.laps[n]! / s.e.target) * 100);
    const lap = t("endurance.lapNumber", { n: n + 1 });
    return {
      a: ratios.length === 0 ? null : ratios.reduce((a, b) => a + b, 0) / ratios.length,
      axis: lap,
      label: `${lap} · ${t("trends.setCount", { count: ratios.length })}`,
      lap: n + 1,
    };
  });
  let holds = 0;
  while (holds < curve.length && (curve[holds]!.a ?? 0) >= 95) holds++;
  const last = [...curve].reverse().find((p) => p.a !== null);

  const tiles = [
    tile({
      id: "laps",
      title: t("endurance.laps"),
      chart: "stack",
      kind: "count",
      ladder,
      total: cur.laps,
      prior: prior?.laps ?? null,
      caption: `${t("trends.circuitLaps")} · ${label}`,
      sub: t("trends.splitClean", {
        clean: count(cur.clean),
        partial: count(cur.laps - cur.clean),
      }),
      series: [
        { key: "clean", label: t("trends.seriesClean") },
        { key: "partial", label: t("trends.seriesPartial") },
      ],
      split: (a, b) => t("trends.splitClean", { clean: count(a), partial: count(b) }),
      points: pointsOver(
        buckets,
        per,
        (x) => x.clean,
        (x) => x.laps - x.clean
      ),
    }),
    tile({
      id: "cleanRate",
      title: t("trends.cleanLapRate"),
      chart: "line",
      kind: "pct",
      ladder,
      total: cur.rate,
      prior: prior?.rate ?? null,
      caption: `${t("trends.lapsWithoutComingOff")} · ${label}`,
      series: [{ key: "clean", label: t("trends.cleanLapRate") }],
      points: pointsOver(buckets, per, (x) => x.rate),
      domain: [0, 100],
    }),
    tile({
      id: "pumpCurve",
      title: t("trends.pumpCurve"),
      chart: "bar",
      kind: "pct",
      ladder,
      total: last?.a ?? null,
      caption: t("trends.pumpCurveCaption"),
      series: [{ key: "clean", label: t("trends.pumpCurve") }],
      points: curve,
      domain: [0, 100],
    }),
    tile({
      id: "moves",
      title: t("trends.movesClimbed"),
      chart: "bar",
      kind: "count",
      ladder,
      total: cur.moves,
      prior: prior?.moves ?? null,
      caption: `${t("trends.movesOnCircuits")} · ${label}`,
      series: [{ key: "clean", label: t("trends.movesClimbed") }],
      points: pointsOver(buckets, per, (x) => x.moves),
    }),
  ];

  const groups = new Map<string, Set_[]>();
  for (const s of inRange) groups.set(s.key, [...(groups.get(s.key) ?? []), s]);
  const circuits: EnduranceCircuitVM[] = [...groups.values()]
    .map((sets) => {
      const latest = sets[sets.length - 1]!;
      const whole = tally(sets);
      const half = Math.floor(sets.length / 2);
      const early = tally(sets.slice(0, half)).rate;
      const late = tally(sets.slice(half)).rate;
      const best = bestRun(sets);
      const trend = half === 0 ? null : delta("pct", late, early, true);
      return {
        key: latest.key,
        label: latest.label,
        colour: latest.colour,
        length: enduranceAmountLabel(latest.e, latest.e.target),
        sets: whole.sets,
        laps: whole.laps,
        rate: whole.rate === null ? "-" : pct(whole.rate),
        ratio: (whole.rate ?? 0) / 100,
        best: t("trends.inARow", { count: best, n: formatNumber(best) }),
        trend: trend ?? "-",
      };
    })
    .sort((a, b) => b.laps - a.laps || a.label.localeCompare(b.label));

  return {
    rangeLabel: label,
    insight:
      cur.laps === 0 || last?.a == null
        ? t("trends.enduranceEmpty")
        : holds > 0
          ? t("trends.pumpInsightHold", {
              laps: t("endurance.lapCount", { count: holds }),
              fade: pct(last.a),
              n: last.lap,
            })
          : t("trends.pumpInsightFade", { fade: pct(last.a), n: last.lap }),
    stats: [
      { key: "laps", label: t("endurance.laps"), value: count(cur.laps), lifetime: null },
      { key: "clean", label: t("trends.cleanLaps"), value: count(cur.clean), lifetime: null },
      {
        key: "rate",
        label: t("trends.cleanRate"),
        value: cur.rate === null ? "-" : pct(cur.rate),
        lifetime: null,
      },
      { key: "moves", label: t("trends.movesClimbed"), value: count(cur.moves), lifetime: null },
      { key: "sets", label: t("trends.sets"), value: count(cur.sets), lifetime: null },
    ],
    tiles,
    circuits,
  };
}
