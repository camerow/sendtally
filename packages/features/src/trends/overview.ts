import type { Gym, SessionWithClimbs } from "@sendtally/api-client";
import { circuitRangeLabel } from "../gyms/transforms";
import { formatNumber, t } from "../i18n";
import { disciplineLabel } from "../log-session/types";
import { UNTAGGED_KEY, untaggedLabel } from "../sessions/tags";
import { bucketsFor, rangeLabel, windowOf } from "./buckets";
import {
  climbsIn,
  ladderFor,
  placeMatches,
  rowsOf,
  sliceOf,
  totals,
  type Ladder,
  type Row,
  type Slice,
  type Totals,
} from "./slice";
import { formatter, pointsOver, tile } from "./tile";
import type {
  GradeBinVM,
  GradePresetVM,
  GradeRange,
  TrendFilter,
  TrendGroupId,
  TrendGroupVM,
  TrendScaleGymVM,
  TrendStatVM,
  TrendTagVM,
  TrendTileId,
  TrendTileVM,
  TrendsVM,
} from "./types";

export function gradeRangeLabel(ladder: Ladder, grade: GradeRange): string {
  return grade.lo === grade.hi
    ? ladder.label(grade.lo)
    : `${ladder.label(grade.lo)}-${ladder.label(grade.hi)}`;
}

function captioned(what: string, gradeText: string | null, range: string): string {
  return [what, gradeText, range].filter((s): s is string => s !== null).join(" · ");
}

function mean(values: number[]): number | null {
  return values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length;
}

/** Early half against late half of the range, so one big month does not read as a trend. */
function gradeInsight(slice: Slice, cur: Totals, per: Totals[], gradeText: string | null): string {
  if (cur.sends === 0 || cur.avg === null) return t("trends.insightNoSends");
  const half = Math.floor(per.length / 2);
  const avgOf = (xs: Totals[]): number | null =>
    mean(xs.flatMap((x) => (x.avg === null ? [] : [x.avg])));
  const early = avgOf(per.slice(0, half));
  const late = avgOf(per.slice(half));
  const avg = slice.ladder.average;
  const vars = { grade: gradeText ?? "" };
  if (early === null || late === null || Math.abs(late - early) < 0.15) {
    return t(gradeText === null ? "trends.insightHolding" : "trends.insightHoldingWithin", {
      ...vars,
      avg: avg(cur.avg),
    });
  }
  const key =
    late > early
      ? gradeText === null
        ? "trends.insightClimbed"
        : "trends.insightClimbedWithin"
      : gradeText === null
        ? "trends.insightSlipped"
        : "trends.insightSlippedWithin";
  return t(key, { ...vars, from: avg(early), to: avg(late) });
}

function lifetimeStats(
  cur: Totals,
  life: Totals,
  curRows: Row[],
  lifeRows: Row[],
  all: boolean
): TrendStatVM[] {
  const count = (n: number): string => formatNumber(n);
  const hardest = (rows: Row[], discipline: "boulder" | "route"): string => {
    const ladder = ladderFor(
      { scope: discipline, range: "all", grade: null, setting: "all", gymId: null, tags: [] },
      rows,
      []
    );
    const ranks = rows.flatMap((r) =>
      r.graded.flatMap((rec) => {
        const rank = rec.climb.kind === "send" ? ladder.rank(rec) : null;
        return rank === null ? [] : [rank];
      })
    );
    return ranks.length === 0 ? "-" : ladder.label(Math.max(...ranks));
  };
  const life_ = (v: string): string =>
    all ? t("trends.rangeAll") : t("trends.lifetimeValue", { value: v });
  return [
    {
      key: "tried",
      label: t("trends.statTried"),
      value: count(cur.climbs),
      lifetime: life_(count(life.climbs)),
    },
    {
      key: "sent",
      label: t("trends.statSent"),
      value: count(cur.sends),
      lifetime: life_(count(life.sends)),
    },
    {
      key: "flashed",
      label: t("trends.statFlashed"),
      value: count(cur.flashes),
      lifetime: life_(count(life.flashes)),
    },
    {
      key: "onsighted",
      label: t("trends.statOnsighted"),
      value: count(cur.onsights),
      lifetime: life_(count(life.onsights)),
    },
    {
      key: "hardestBoulder",
      label: t("trends.statHardestBoulder"),
      value: hardest(curRows, "boulder"),
      lifetime: life_(hardest(lifeRows, "boulder")),
    },
    {
      key: "hardestRoute",
      label: t("trends.statHardestRoute"),
      value: hardest(curRows, "route"),
      lifetime: life_(hardest(lifeRows, "route")),
    },
    {
      key: "sessions",
      label: t("common.sessions"),
      value: count(cur.sessions),
      lifetime: life_(count(life.sessions)),
    },
    {
      key: "laps",
      label: t("endurance.laps"),
      value: count(cur.laps),
      lifetime: life_(count(life.laps)),
    },
  ];
}

function gradeBins(slice: Slice, start: number, end: number): GradeBinVM[] {
  const counts = new Map<number, number>();
  const unfiltered: Slice = { ...slice, grade: null };
  for (const row of slice.rows) {
    if (row.time < start || row.time >= end) continue;
    for (const rec of climbsIn(unfiltered, row)) {
      const rank = slice.ladder.rank(rec);
      if (rank !== null) counts.set(rank, (counts.get(rank) ?? 0) + 1);
    }
  }
  if (counts.size === 0) return [];
  const ranks = [...counts.keys()];
  const out: GradeBinVM[] = [];
  for (let rank = Math.min(...ranks); rank <= Math.max(...ranks); rank++) {
    out.push({ rank, label: slice.ladder.label(rank), count: counts.get(rank) ?? 0 });
  }
  return out;
}

function presetsOf(ladder: Ladder, bins: GradeBinVM[]): GradePresetVM[] {
  const present = bins.filter((b) => b.count > 0);
  const low = present[0]?.rank;
  const top = present[present.length - 1]?.rank;
  const any: GradePresetVM = { key: "any", label: t("trends.anyGrade"), grade: null };
  if (low === undefined || top === undefined) return [any];
  const limit = Math.max(low, top - 2);
  const volume = Math.max(low, top - 3);
  return [
    any,
    {
      key: "limit",
      label: t("trends.presetLimit", { grade: ladder.label(limit) }),
      grade: { lo: limit, hi: top },
    },
    {
      key: "volume",
      label: t("trends.presetVolume", { grade: ladder.label(volume) }),
      grade: { lo: low, hi: volume },
    },
  ];
}

export function trendsVM(
  sessions: SessionWithClimbs[],
  gyms: Gym[],
  filter: TrendFilter,
  now: Date = new Date()
): TrendsVM {
  const rows = rowsOf(sessions);
  const slice = sliceOf(filter, rows, gyms);
  const { ladder } = slice;
  const scope = ladder.scope;
  const all = scope === "all";
  const range = rangeLabel(filter.range);
  const buckets = bucketsFor(filter.range, now, rows[0]?.time ?? null);
  const { start, end } = windowOf(buckets);
  const cur = totals(slice, start, end);
  const prior = filter.range === "all" ? null : totals(slice, start - (end - start), start);
  const per = buckets.map((b) => totals(slice, b.start, b.end));
  const gradeText = slice.grade === null ? null : gradeRangeLabel(ladder, slice.grade);
  const cap = (what: string): string => captioned(what, gradeText, range);
  const prev = <K extends keyof Totals>(k: K): Totals[K] | null =>
    prior === null ? null : prior[k];
  const over = (a: (x: Totals) => number | null, b?: (x: Totals) => number | null) =>
    pointsOver(buckets, per, a, b);

  const count = formatter("count", ladder);
  const splitInside = (a: number, b: number): string =>
    t("trends.splitInside", { inside: count(a), outside: count(b) });
  const splitBouldersRoutes = (a: number, b: number): string =>
    t("trends.splitBouldersRoutes", {
      boulders: t("trends.boulderCount", { count: a, n: count(a) }),
      routes: t("trends.routeCount", { count: b, n: count(b) }),
    });
  const tiles: Partial<Record<TrendTileId, TrendTileVM>> = {};

  tiles.volume = all
    ? tile({
        id: "volume",
        title: t("trends.volume"),
        chart: "stack",
        kind: "count",
        ladder,
        total: cur.climbs,
        prior: prev("climbs"),
        caption: cap(t("trends.climbsLogged")),
        sub: splitBouldersRoutes(cur.boulders, cur.routes),
        series: [
          { key: "boulder", label: disciplineLabel("boulder") },
          { key: "route", label: disciplineLabel("route") },
        ],
        split: splitBouldersRoutes,
        points: over(
          (x) => x.boulders,
          (x) => x.routes
        ),
      })
    : tile({
        id: "volume",
        title: t("trends.volume"),
        chart: "stack",
        kind: "count",
        ladder,
        total: cur.climbs,
        prior: prev("climbs"),
        caption: cap(t("trends.climbsLogged")),
        sub: t("trends.splitSent", { sent: count(cur.sends), notYet: count(cur.attempts) }),
        series: [
          { key: "sent", label: t("trends.seriesSent") },
          { key: "notYet", label: t("trends.seriesNotYet") },
        ],
        split: (a, b) => t("trends.splitSent", { sent: count(a), notYet: count(b) }),
        points: over(
          (x) => x.sends,
          (x) => x.attempts
        ),
      });

  tiles.days = tile({
    id: "days",
    title: t("trends.daysClimbing"),
    chart: "stack",
    kind: "count",
    ladder,
    total: cur.days,
    prior: prev("days"),
    caption: cap(t("trends.daysWithSession")),
    sub: splitInside(cur.inside, cur.outside),
    series: [
      { key: "inside", label: t("trends.seriesInside") },
      { key: "outside", label: t("trends.seriesOutside") },
    ],
    split: splitInside,
    points: over(
      (x) => x.inside,
      (x) => x.outside
    ),
    link: "days",
  });

  tiles.effort = tile({
    id: "effort",
    title: t("common.effort"),
    chart: "line",
    kind: "decimal",
    ladder,
    total: cur.rpe,
    prior: prev("rpe"),
    caption: cap(t("trends.avgSessionRpe")),
    unit: "/10",
    series: [{ key: "effort", label: t("common.effort") }],
    points: over((x) => x.rpe),
    domain: [0, 10],
  });

  if (all) {
    tiles.hours = tile({
      id: "hours",
      title: t("trends.timeOnWall"),
      chart: "bar",
      kind: "hours",
      ladder,
      total: cur.hours,
      prior: prev("hours"),
      caption: cap(t("trends.sessionHours")),
      points: over((x) => x.hours),
    });
  } else {
    tiles.hardest = tile({
      id: "hardest",
      title: t("trends.hardestSend"),
      chart: "line",
      kind: "grade",
      ladder,
      total: cur.hardest,
      prior: prev("hardest"),
      caption: cap(t("trends.maxGradeSent")),
      points: over((x) => x.hardest),
    });
    tiles.avggrade = tile({
      id: "avggrade",
      title: t("trends.avgGrade"),
      chart: "line",
      kind: "gradeAvg",
      ladder,
      total: cur.avg,
      prior: prev("avg"),
      caption: cap(t("trends.avgSendGrade")),
      points: over((x) => x.avg),
    });
    const ranks = cur.sendRanks.map((s) => s.rank);
    const pyramid = [];
    if (ranks.length > 0) {
      for (let rank = Math.min(...ranks); rank <= Math.max(...ranks); rank++) {
        const at = cur.sendRanks.filter((s) => s.rank === rank);
        const first = at.filter((s) => s.firstTry).length;
        const label = ladder.label(rank);
        pyramid.push({
          a: at.length - first,
          b: first,
          axis: label,
          label: t("trends.gradeSends", { grade: label }),
        });
      }
    }
    tiles.pyramid = tile({
      id: "pyramid",
      title: t("trends.gradePyramid"),
      chart: "stack",
      kind: "count",
      ladder,
      total: cur.sendRanks.length,
      prior: prior === null ? null : prior.sendRanks.length,
      caption: cap(t("trends.sendsByGrade")),
      sub: t("trends.splitWorked", {
        worked: count(cur.sendRanks.length - cur.sendRanks.filter((s) => s.firstTry).length),
        first: count(cur.sendRanks.filter((s) => s.firstTry).length),
      }),
      series: [
        { key: "worked", label: t("trends.seriesWorked") },
        { key: "firstTry", label: t("trends.seriesFirstTry") },
      ],
      split: (a, b) => t("trends.splitWorked", { worked: count(a), first: count(b) }),
      points: pyramid,
    });
  }

  tiles.flash = tile({
    id: "flash",
    title: scope === "route" ? t("trends.onsightFlashRate") : t("trends.flashRate"),
    chart: "bar",
    kind: "pct",
    ladder,
    total: cur.flashRate,
    prior: prev("flashRate"),
    caption: cap(t("trends.firstTrySends")),
    points: over((x) => x.flashRate),
  });
  tiles.tries = tile({
    id: "tries",
    title: t("trends.triesPerSend"),
    chart: "line",
    kind: "decimal",
    ladder,
    total: cur.tries,
    prior: prev("tries"),
    caption: cap(t("trends.avgGoesBeforeSend")),
    points: over((x) => x.tries),
  });
  if (cur.laps > 0) {
    tiles.endurance = tile({
      id: "endurance",
      title: t("endurance.title"),
      chart: "stack",
      kind: "count",
      ladder,
      total: cur.laps,
      prior: prev("laps"),
      caption: captioned(t("trends.circuitLaps"), null, range),
      sub: t("trends.splitClean", {
        clean: count(cur.clean),
        partial: count(cur.laps - cur.clean),
      }),
      series: [
        { key: "clean", label: t("trends.seriesClean") },
        { key: "partial", label: t("trends.seriesPartial") },
      ],
      split: (a, b) => t("trends.splitClean", { clean: count(a), partial: count(b) }),
      points: over(
        (x) => x.clean,
        (x) => x.laps - x.clean
      ),
      link: "endurance",
    });
  }

  const avgRpe = cur.rpe === null ? "-" : formatter("decimal", ladder)(cur.rpe);
  const pct = formatter("pct", ladder);
  const insights: Record<TrendGroupId, () => string> = {
    grade: () => gradeInsight(slice, cur, per, gradeText),
    volume: () =>
      t("trends.insightVolume", {
        climbs: t("common.climbCount", { count: cur.climbs }),
        days: t("trends.dayCount", { count: cur.days }),
        rpe: avgRpe,
      }),
    technique: () =>
      cur.flashRate === null || cur.tries === null
        ? t("trends.insightNoSends")
        : t("trends.insightTechnique", {
            rate: pct(cur.flashRate),
            tries: formatter("decimal", ladder)(cur.tries),
          }),
    endurance: () =>
      t("trends.insightEndurance", {
        laps: t("endurance.lapCount", { count: cur.laps }),
        clean: count(cur.clean),
      }),
  };
  const layout: Array<{ id: TrendGroupId; ids: TrendTileId[] }> = [
    { id: "grade", ids: ["hardest", "avggrade", "pyramid"] },
    {
      id: "volume",
      ids: all ? ["volume", "days", "effort", "hours"] : ["volume", "days", "effort"],
    },
    { id: "technique", ids: ["flash", "tries"] },
    { id: "endurance", ids: ["endurance"] },
  ];
  const groups: TrendGroupVM[] = layout
    .map(({ id, ids }) => ({
      id,
      title: t(`trends.group.${id}`),
      question: t(`trends.question.${id}`),
      insight: "",
      tiles: ids.flatMap((k) => (tiles[k] === undefined ? [] : [tiles[k]])),
    }))
    .filter((g) => g.tiles.length > 0 && (cur.sessions > 0 || g.id !== "endurance"))
    .map((g) => ({ ...g, insight: insights[g.id]() }));

  const life = all ? totals({ ...slice, rows }, -Infinity, Infinity) : null;
  const inWindow = (r: Row): boolean => r.time >= start && r.time < end;
  const stats =
    life === null
      ? null
      : lifetimeStats(cur, life, slice.rows.filter(inWindow), rows, filter.range === "all");

  const bins = all ? [] : gradeBins(slice, start, end);

  const windowed = rows.filter(inWindow);
  const gymSessions = (id: string): number =>
    windowed.filter((r) => r.session.gym_id === id).length;
  const tagCounts = new Map<string, TrendTagVM>();
  let untagged = 0;
  for (const row of windowed.filter((r) => placeMatches(r, filter.setting, filter.gymId))) {
    if (row.session.tags.length === 0) untagged++;
    for (const tag of row.session.tags) {
      const entry = tagCounts.get(tag.slug) ?? { slug: tag.slug, name: tag.name, sessions: 0 };
      entry.sessions++;
      tagCounts.set(tag.slug, entry);
    }
  }
  const tags = [...tagCounts.values()].sort(
    (a, b) => b.sessions - a.sessions || a.name.localeCompare(b.name)
  );
  if (untagged > 0) tags.push({ slug: UNTAGGED_KEY, name: untaggedLabel(), sessions: untagged });

  const scaleGyms: TrendScaleGymVM[] = gyms
    .filter((g) => g.circuits.length > 0)
    .map((g) => ({
      id: g.id,
      name: g.name,
      sessions: gymSessions(g.id),
      ladder: [...g.circuits]
        .sort((a, b) => a.low - b.low || a.high - b.high)
        .map((c) => ({ id: c.id, colour: c.colour, range: circuitRangeLabel(c, g.scale) })),
    }));

  return {
    scope,
    rangeLabel: range,
    sessions: cur.sessions,
    sessionsLine: `${t("sessions.sessionCount", { count: cur.sessions })} · ${range}`,
    insight: all
      ? t("trends.insightAll", {
          days: t("trends.dayCount", { count: cur.days }),
          outside: count(cur.outside),
          hours: formatter("hours", ladder)(cur.hours),
        })
      : gradeInsight(slice, cur, per, gradeText),
    stats,
    groups,
    grades: bins,
    gradeLabel: gradeText,
    presets: all ? [] : presetsOf(ladder, bins),
    gyms: gyms
      .map((g) => ({ id: g.id, name: g.name, sessions: gymSessions(g.id) }))
      .sort((a, b) => b.sessions - a.sessions || a.name.localeCompare(b.name)),
    scaleGyms,
    tags,
  };
}
