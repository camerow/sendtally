import { formatGrade, routeIndexOf, vFromFont, type Grade } from "@sendtally/core";
import type { ClimbSummary, SessionWithClimbs } from "@sendtally/api-client";
import { sessionDay } from "../sessions/meta";
import { MONTH_SHORT_NAMES } from "../sessions/months";
import { sessionTitle } from "../sessions/title";
import { durationLabel, sessionMinutes } from "../sessions/years";
import {
  climbKey,
  projectMetaLabel,
  projectStatus,
  projectsOf,
  type ProjectStatus,
} from "./transforms";

const WEEK_MS = 7 * 24 * 3_600_000;

export type ProjectStat = { label: string; value: string };

export type ProjectBar = {
  height: number;
  valueLabel: string;
  axisLabel: string;
  peak: boolean;
  sent: boolean;
};

export type ProjectSessionVM = {
  fingerprint: string;
  weekday: string;
  dateLabel: string;
  title: string;
  metaLabel: string;
  attempts: number;
  sent: boolean;
  notes: string | null;
};

export type ProjectDetailVM = {
  slug: string;
  name: string;
  gradeLabel: string | null;
  disciplineLabel: string;
  status: ProjectStatus;
  storyLabel: string | null;
  sessionsMetaLabel: string;
  rangeLabel: string;
  stats: ProjectStat[];
  bars: ProjectBar[];
  sessions: ProjectSessionVM[];
  beta: string | null;
  betaUpdatedLabel: string | null;
};

export type ProjectHighlight = { name: string; slug: string; value: string };

export type ProjectsOverviewVM = {
  open: number;
  sent: number;
  attemptsInvested: number;
  avgAttemptsToSend: number | null;
  longestRunning: ProjectHighlight | null;
  mostSessions: ProjectHighlight | null;
  hardestSentLabel: string | null;
};

export function gradeRank(grade: Grade): number {
  switch (grade.scale) {
    case "v":
      return grade.value;
    case "font":
      return vFromFont(grade.value) ?? -1;
    default:
      return routeIndexOf(grade) ?? -1;
  }
}

// Months come from the shared table rather than the platform's locale data, so
// a label reads the same in the Worker, the browser and the app.
export function dateLabel(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTH_SHORT_NAMES[d.getUTCMonth()] ?? ""}`;
}

export function weeksBetween(fromIso: string, toIso: string): number {
  const weeks = Math.round((Date.parse(toIso) - Date.parse(fromIso)) / WEEK_MS);
  return Math.max(weeks, 0);
}

function spanLabel(weeks: number): string {
  if (weeks < 1) return "THIS WEEK";
  return `${weeks} ${weeks === 1 ? "WEEK" : "WEEKS"}`;
}

export function disciplineLabel(climb: ClimbSummary): string {
  return climb.discipline === "route" ? "ROUTE" : "BOULDER";
}

// Every session the climb appears in, oldest first: the attempts that went into
// it, and the session's own note for the context around them.
export function projectSessions(
  climb: ClimbSummary,
  sessions: SessionWithClimbs[]
): ProjectSessionVM[] {
  const key = climbKey(climb.name);
  const oldestFirst = [...sessions].sort((a, b) => Date.parse(a.start_at) - Date.parse(b.start_at));
  const out: ProjectSessionVM[] = [];
  for (const session of oldestFirst) {
    const rows = session.climbs.filter((c) => climbKey(c.name) === key);
    if (rows.length === 0) continue;
    const day = sessionDay(session);
    out.push({
      fingerprint: session.fingerprint,
      weekday: day.weekday,
      dateLabel: dateLabel(session.start_at),
      title: sessionTitle(session),
      metaLabel: `RPE ${session.rpe} · ${durationLabel(sessionMinutes(session))}`,
      attempts: rows.reduce((n, c) => n + c.tries, 0),
      sent: rows.some((c) => c.kind === "send"),
      notes: session.notes,
    });
  }
  return out;
}

export function projectBars(climb: ClimbSummary, sessions: SessionWithClimbs[]): ProjectBar[] {
  return bars(projectSessions(climb, sessions));
}

// With one session everything is the peak, so the highlight only earns its
// place once there is a shape to point at.
function bars(rows: ProjectSessionVM[]): ProjectBar[] {
  const most = Math.max(0, ...rows.map((r) => r.attempts));
  return rows.map((r) => ({
    height: most === 0 ? 0 : r.attempts / most,
    valueLabel: String(r.attempts),
    axisLabel: r.dateLabel,
    peak: rows.length > 1 && most > 0 && r.attempts === most && !r.sent,
    sent: r.sent,
  }));
}

export function projectDetailVM(
  climb: ClimbSummary,
  sessions: SessionWithClimbs[],
  now: Date = new Date()
): ProjectDetailVM {
  const ordered = projectSessions(climb, sessions);
  const status = projectStatus(climb);
  const endIso = status === "sent" ? climb.last_at : now.toISOString();
  const weeks = weeksBetween(climb.first_at, endIso);
  const stats: ProjectStat[] = [
    { label: "ATTEMPTS", value: String(climb.attempts) },
    { label: "SESSIONS", value: String(climb.sessions) },
    {
      label: status === "sent" ? "TOOK" : "RUNNING",
      value: climb.sessions === 0 ? "-" : spanLabel(weeks),
    },
    {
      label: status === "sent" ? "SENT" : "LAST TRIED",
      value: climb.sessions === 0 ? "-" : dateLabel(climb.last_at),
    },
  ];
  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  return {
    slug: climb.slug,
    name: climb.name,
    gradeLabel: climb.grade === null ? null : formatGrade(climb.grade),
    disciplineLabel: disciplineLabel(climb),
    status,
    storyLabel:
      status === "sent"
        ? `${climb.attempts} ${climb.attempts === 1 ? "attempt" : "attempts"} over ${climb.sessions} ${climb.sessions === 1 ? "session" : "sessions"}`
        : null,
    sessionsMetaLabel: projectMetaLabel(climb),
    rangeLabel:
      first === undefined
        ? "NOTHING LOGGED YET"
        : first === last
          ? first.dateLabel
          : `${first.dateLabel} → ${last?.dateLabel}`,
    stats,
    bars: bars(ordered),
    sessions: [...ordered].reverse(),
    beta: climb.beta,
    betaUpdatedLabel:
      climb.beta_updated_at === null ? null : `UPDATED ${dateLabel(climb.beta_updated_at)}`,
  };
}

export function projectsOverview(
  climbs: ClimbSummary[],
  now: Date = new Date()
): ProjectsOverviewVM {
  const projects = projectsOf(climbs);
  const open = projects.filter((p) => projectStatus(p) === "open");
  const sent = projects.filter((p) => projectStatus(p) === "sent");
  const attemptsInvested = open.reduce((n, p) => n + p.attempts, 0);
  const sentAttempts = sent.reduce((n, p) => n + p.attempts, 0);

  const running = open
    .filter((p) => p.sessions > 0)
    .map((p) => ({ p, weeks: weeksBetween(p.first_at, now.toISOString()) }))
    .sort((a, b) => b.weeks - a.weeks)[0];
  const busiest = [...projects].sort((a, b) => b.sessions - a.sessions)[0];

  // Grades only compare inside a discipline, so the hardest send is read from
  // whichever discipline the user sends most projects in.
  const graded = sent.flatMap((p) => (p.grade === null ? [] : [{ p, grade: p.grade }]));
  const discipline = graded[0]?.p.discipline ?? "boulder";
  const hardest = graded
    .filter((g) => g.p.discipline === discipline)
    .sort((a, b) => gradeRank(b.grade) - gradeRank(a.grade))[0];

  return {
    open: open.length,
    sent: sent.length,
    attemptsInvested,
    avgAttemptsToSend: sent.length === 0 ? null : Math.round(sentAttempts / sent.length),
    longestRunning:
      running === undefined
        ? null
        : { name: running.p.name, slug: running.p.slug, value: spanLabel(running.weeks) },
    mostSessions:
      busiest === undefined || busiest.sessions === 0
        ? null
        : { name: busiest.name, slug: busiest.slug, value: String(busiest.sessions) },
    hardestSentLabel: hardest === undefined ? null : formatGrade(hardest.grade),
  };
}
