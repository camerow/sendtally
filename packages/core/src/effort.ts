import {
  disciplineOf,
  formatGrade,
  routeGradeFromIndex,
  routeIndexOf,
  type Discipline,
  type Grade,
} from "./grades";
export type ClimbKind = "send" | "attempt";

/**
 * How a send happened. Display only - every send scores the same points for its grade,
 * whether it took one go or twenty, so adding a style never moves an RPE.
 * Onsight is a route idea; boulders read "redpoint" as plain "sent".
 */
export type ClimbStyle = "redpoint" | "flash" | "onsight";

export type EnduranceUnit = "moves" | "seconds";

/**
 * Laps on a circuit of a fixed length. `laps[i] === target` means that lap went
 * clean, anything less means they came off partway. Time is always seconds.
 */
export type Endurance = {
  unit: EnduranceUnit;
  target: number;
  laps: number[];
};

export type Climb = {
  time: Date;
  vGrade: number;
  name: string;
  kind: ClimbKind;
  tries: number;
  style?: ClimbStyle;
  angle?: number;
  grade?: Grade;
  endurance?: Endurance;
};

export type Session = {
  start: Date;
  end: Date;
  climbs: Climb[];
};

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

// The two divisors are the calibration knob: how much work counts as one climb's
// worth of effort. Tune them here and every endurance session re-scores.
export const MOVES_PER_EQUIVALENT = 8;
export const SECONDS_PER_EQUIVALENT = 90;

export type EnduranceTotals = { laps: number; done: number; total: number; clean: number };

export function enduranceTotals(e: Endurance): EnduranceTotals {
  return {
    laps: e.laps.length,
    done: e.laps.reduce((a, b) => a + b, 0),
    total: e.laps.length * e.target,
    clean: e.laps.filter((lap) => lap === e.target).length,
  };
}

/** Time reads in whole minutes and seconds, so 90 is a minute and a half, never 90 sec. */
export function enduranceTimeParts(seconds: number): { min: number; sec: number } {
  return { min: Math.floor(seconds / 60), sec: seconds % 60 };
}

export function enduranceEquivalents(e: Endurance): number {
  const done = enduranceTotals(e).done;
  return done / (e.unit === "moves" ? MOVES_PER_EQUIVALENT : SECONDS_PER_EQUIVALENT);
}

export function isEndurance(c: { endurance?: Endurance | undefined }): boolean {
  return c.endurance !== undefined;
}

export function sessionPoints(s: Session, cfg: EffortConfig): number {
  let pts = 0;
  for (const c of s.climbs) {
    const p = points(c.vGrade);
    if (c.endurance !== undefined) pts += p * enduranceEquivalents(c.endurance);
    else pts += c.kind === "attempt" ? p * cfg.bidWeight : p;
  }
  return pts;
}

/** Laps are the unit of work for density: three circuits of five laps is fifteen goes at the wall. */
function densityCount(climbs: readonly Climb[]): number {
  return climbs.reduce((n, c) => n + (c.endurance?.laps.length ?? 1), 0);
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
    const density = densityCount(target.climbs) / span;
    if (density >= cfg.densityHigh) nudge++;
    else if (density <= cfg.densityLow) nudge--;
  }

  let rollingMax = 0;
  for (const h of ref) {
    for (const c of h.climbs) {
      if (c.kind === "send" && !isEndurance(c) && c.vGrade > rollingMax) rollingMax = c.vGrade;
    }
  }
  if (rollingMax > 0 && target.climbs.some((c) => !isEndurance(c) && c.vGrade > rollingMax))
    nudge++;

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
  return s.climbs.reduce((hi, c) => (!isEndurance(c) && c.vGrade > hi ? c.vGrade : hi), -1);
}

export type GradedClimb = {
  vGrade: number;
  grade?: Grade | undefined;
  endurance?: Endurance | undefined;
};

export function climbGrade(c: GradedClimb): Grade {
  return c.grade ?? { scale: "v", value: c.vGrade };
}

export function climbDiscipline(c: GradedClimb): Discipline {
  return disciplineOf(climbGrade(c).scale);
}

// A felt-like grade on an endurance climb is not a top-grade statistic, so every
// grade readout here drops those climbs.
export function dominantDiscipline(climbs: readonly GradedClimb[]): Discipline {
  const graded = climbs.filter((c) => !isEndurance(c));
  const routes = graded.filter((c) => climbDiscipline(c) === "route").length;
  return routes > graded.length - routes ? "route" : "boulder";
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
  const graded = climbs.filter(
    (c) => !isEndurance(c) && climbDiscipline(c) === discipline && climbRank(c) >= 0
  );
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

function enduranceAmount(e: Endurance, value: number): string {
  if (e.unit === "moves") return plural(value, "move");
  const { min, sec } = enduranceTimeParts(value);
  if (min === 0) return `${sec} sec`;
  return sec === 0 ? `${min} min` : `${min} min ${sec} sec`;
}

function enduranceProgress(e: Endurance): string {
  const { done, total } = enduranceTotals(e);
  const left = e.unit === "moves" ? String(done) : enduranceAmount(e, done);
  return `${left} of ${enduranceAmount(e, total)}`;
}

function climbLine(c: Climb): string {
  const mark = c.kind === "attempt" ? "✗" : "✓";
  let line = `${mark} ${formatGrade(climbGrade(c))}`;
  if (c.name !== "") line += ` ${c.name}`;
  if (c.endurance !== undefined) {
    const laps = plural(c.endurance.laps.length, "lap");
    return `${line} (${laps} · ${enduranceProgress(c.endurance)})`;
  }
  if (c.kind === "send" && (c.style === "flash" || c.style === "onsight")) line += ` (${c.style})`;
  else if (c.tries > 1) line += ` (${c.tries} tries)`;
  return line;
}
