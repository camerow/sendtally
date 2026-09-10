import {
  disciplineOf,
  formatGrade,
  routeGradeFromIndex,
  routeIndexOf,
  type Discipline,
  type Grade,
} from "./grades";
import type { Climb, Session } from "./session";

export type EffortConfig = {
  bidWeight: number;
  densityHigh: number;
  densityLow: number;
  windowMs: number;
  minHistory: number;
};

export type EffortResult = {
  rpe: number;
  title: string;
  summary: string;
};

const HOUR = 3_600_000;

export function defaultEffortConfig(): EffortConfig {
  return {
    bidWeight: 0.4,
    densityHigh: 12,
    densityLow: 5,
    windowMs: 8 * 7 * 24 * HOUR,
    minHistory: 3,
  };
}

export function points(vGrade: number): number {
  const grade = vGrade < 0 ? 1 : vGrade;
  return Math.pow(2, grade / 2);
}

export function sessionPoints(s: Session, cfg: EffortConfig): number {
  let pts = 0;
  for (const c of s.climbs) {
    const p = points(c.vGrade);
    pts += c.kind === "attempt" ? p * cfg.bidWeight : p;
  }
  return pts;
}

export function score(
  target: Session,
  history: Session[],
  cfg: EffortConfig,
  rpeOverride?: number
): EffortResult {
  const pts = sessionPoints(target, cfg);

  let ref = history.filter(
    (h) =>
      h.end.getTime() < target.start.getTime() &&
      target.start.getTime() - h.end.getTime() <= cfg.windowMs
  );
  if (ref.length < cfg.minHistory) ref = history;

  let base = 6;
  if (ref.length > 0) {
    const med = median(ref.map((h) => sessionPoints(h, cfg)));
    if (med > 0) base = 6 * Math.sqrt(pts / med);
  }

  let nudge = 0;
  if (target.climbs.length > 1) {
    const first = target.climbs[0]!;
    const last = target.climbs[target.climbs.length - 1]!;
    const span = Math.max((last.time.getTime() - first.time.getTime()) / HOUR, 0.5);
    const density = target.climbs.length / span;
    if (density >= cfg.densityHigh) nudge++;
    else if (density <= cfg.densityLow) nudge--;
  }

  let rollingMax = 0;
  for (const h of ref) {
    for (const c of h.climbs) {
      if (c.kind === "send" && c.vGrade > rollingMax) rollingMax = c.vGrade;
    }
  }
  if (rollingMax > 0 && target.climbs.some((c) => c.vGrade > rollingMax)) nudge++;

  const rpe = Math.min(10, Math.max(1, Math.round(rpeOverride ?? base + nudge)));

  return {
    rpe,
    title: title(rpe, target, volumeDriven(target, rollingMax)),
    summary: summary(rpe, target),
  };
}

function volumeDriven(s: Session, rollingMax: number): boolean {
  const hi = topEffortGrade(s);
  return rollingMax > 0 && hi >= 0 && hi <= rollingMax - 2;
}

function median(xs: number[]): number {
  const sorted = [...xs].sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) return 0;
  if (n % 2 === 1) return sorted[(n - 1) / 2]!;
  return (sorted[n / 2 - 1]! + sorted[n / 2]!) / 2;
}

function adjective(rpe: number): string {
  if (rpe <= 3) return "Easy climbing session";
  if (rpe <= 5) return "Casual climbing session";
  if (rpe <= 7) return "Solid climbing session";
  if (rpe <= 9) return "Hard climbing session";
  return "Max effort climbing session";
}

function topEffortGrade(s: Session): number {
  return s.climbs.reduce((hi, c) => (c.vGrade > hi ? c.vGrade : hi), -1);
}

export type GradedClimb = { vGrade: number; grade?: Grade | undefined };

export function climbGrade(c: GradedClimb): Grade {
  return c.grade ?? { scale: "v", value: c.vGrade };
}

export function climbDiscipline(c: GradedClimb): Discipline {
  return disciplineOf(climbGrade(c).scale);
}

export function dominantDiscipline(climbs: readonly GradedClimb[]): Discipline {
  const routes = climbs.filter((c) => climbDiscipline(c) === "route").length;
  return routes > climbs.length - routes ? "route" : "boulder";
}

export function climbRank(c: GradedClimb): number {
  const grade = climbGrade(c);
  return disciplineOf(grade.scale) === "route" ? (routeIndexOf(grade) ?? -1) : c.vGrade;
}

type DisciplineStats = {
  discipline: Discipline;
  scale: Grade["scale"];
  lo: number;
  hi: number;
  avg: number;
  top: Climb;
};

function disciplineStats(climbs: readonly Climb[], discipline: Discipline): DisciplineStats | null {
  const graded = climbs.filter((c) => climbDiscipline(c) === discipline && climbRank(c) >= 0);
  if (graded.length === 0) return null;
  let top = graded[0]!;
  let lo = climbRank(top);
  let hi = lo;
  let sum = 0;
  for (const c of graded) {
    const r = climbRank(c);
    sum += r;
    if (r < lo) lo = r;
    if (r > hi) {
      hi = r;
      top = c;
    }
  }
  return {
    discipline,
    scale: climbGrade(graded[0]!).scale,
    lo,
    hi,
    avg: sum / graded.length,
    top,
  };
}

function rankLabel(stats: DisciplineStats, rank: number): string {
  if (stats.discipline === "boulder") return `V${rank}`;
  const scale = stats.scale === "french" ? "french" : "yds";
  const grade = routeGradeFromIndex(scale, rank);
  return grade === undefined ? "?" : formatGrade(grade);
}

function averageLabel(stats: DisciplineStats): string {
  if (stats.discipline === "boulder") return `V${stats.avg.toFixed(1)}`;
  return rankLabel(stats, Math.round(stats.avg));
}

function gradeStats(stats: DisciplineStats): string {
  return `${rankLabel(stats, stats.lo)}-${rankLabel(stats, stats.hi)} · avg ${averageLabel(stats)}`;
}

export function topGradeLabel(climbs: readonly Climb[]): string | undefined {
  const stats = disciplineStats(climbs, dominantDiscipline(climbs));
  return stats === null ? undefined : formatGrade(climbGrade(stats.top));
}

function title(rpe: number, s: Session, volume: boolean): string {
  let adj = adjective(rpe);
  if (volume && rpe >= 8) {
    adj = rpe === 10 ? "Max volume climbing session" : "High volume climbing session";
  }
  const climbs = plural(s.climbs.length, "climb");
  const top = topGradeLabel(s.climbs);
  if (top === undefined) return `${adj} · ${climbs}`;
  return `${adj} · ${climbs}, top ${top}`;
}

function plural(n: number, word: string): string {
  return n === 1 ? `${n} ${word}` : `${n} ${word}s`;
}

function summary(rpe: number, s: Session): string {
  let sends = 0;
  let attempts = 0;
  for (const c of s.climbs) {
    if (c.kind === "send") sends++;
    else attempts++;
  }
  const grades = (["boulder", "route"] as const)
    .map((d) => disciplineStats(s.climbs, d))
    .filter((stats): stats is DisciplineStats => stats !== null)
    .map((stats) => ` · ${gradeStats(stats)}`)
    .join("");

  const lines = [
    `RPE ${rpe}/10 · ${plural(sends, "send")}, ${plural(attempts, "attempt")}${grades}`,
    "created by https://sendtally.com",
    ...s.climbs.map(climbLine),
  ];
  return lines.join("\n");
}

function climbLine(c: Climb): string {
  const mark = c.kind === "attempt" ? "✗" : "✓";
  let line = `${mark} ${formatGrade(climbGrade(c))}`;
  if (c.name !== "") line += ` ${c.name}`;
  if (c.tries > 1) line += ` (${c.tries} tries)`;
  return line;
}
