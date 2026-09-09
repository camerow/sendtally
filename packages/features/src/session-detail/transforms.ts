import { climbDiscipline, climbRank, dominantDiscipline } from "@sendtally/core";
import type { ConnectionStatus, SessionClimb, SessionDetail } from "@sendtally/api-client";
import { climbGradeLabel, gradeFormatterFor } from "../sessions/grades";
import type {
  ClimbFilter,
  ClimbResult,
  ClimbSort,
  ClimbVM,
  GradeBarVM,
  PostingStatus,
  PostStatusVM,
  SessionDetailVM,
  StatVM,
} from "./types";
import { BOARD_LABELS } from "./types";

export function durationLabel(startAt: string, endAt: string): string {
  const minutes = Math.max(0, Math.round((Date.parse(endAt) - Date.parse(startAt)) / 60_000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

export function gradeLabel(vGrade: number): string {
  return vGrade >= 0 ? `V${vGrade}` : "V?";
}

function resultOf(c: SessionClimb): ClimbResult {
  if (c.kind === "attempt") return "project";
  return c.tries <= 1 ? "flash" : "sent";
}

function restLabel(minutes: number | null): string {
  if (minutes === null || minutes <= 0) return "-";
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${minutes}m`;
}

function topSendRank(climbs: SessionClimb[]): number {
  let hi = -1;
  for (const c of climbs) {
    const rank = climbRank(c);
    if (c.kind === "send" && rank > hi) hi = rank;
  }
  return hi;
}

export function climbVMs(climbs: SessionClimb[]): ClimbVM[] {
  const ordered = [...climbs].sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
  const discipline = dominantDiscipline(ordered);
  const top = topSendRank(ordered.filter((c) => climbDiscipline(c) === discipline));
  return ordered.map((c, i) => {
    const prev = ordered[i - 1];
    const rest =
      prev === undefined ? null : Math.round((Date.parse(c.time) - Date.parse(prev.time)) / 60_000);
    const rank = climbRank(c);
    return {
      n: i + 1,
      name: c.name !== "" ? c.name : "Unknown climb",
      gradeLabel: climbGradeLabel(c),
      grade: c.vGrade,
      isTopSend:
        c.kind === "send" && rank >= 0 && climbDiscipline(c) === discipline && rank === top,
      angleLabel: c.angle !== null ? `${c.angle}°` : "-",
      burns: c.tries,
      restLabel: restLabel(rest),
      result: resultOf(c),
    };
  });
}

const FILTERS: Record<ClimbFilter, (c: ClimbVM) => boolean> = {
  all: () => true,
  sent: (c) => c.result === "flash" || c.result === "sent",
  flash: (c) => c.result === "flash",
  project: (c) => c.result === "project",
};

const SORTS: Record<ClimbSort, (a: ClimbVM, b: ClimbVM) => number> = {
  order: (a, b) => a.n - b.n,
  gradeDesc: (a, b) => b.grade - a.grade || a.n - b.n,
  gradeAsc: (a, b) => a.grade - b.grade || a.n - b.n,
  burns: (a, b) => b.burns - a.burns || a.n - b.n,
};

export function filterAndSortClimbs(
  climbs: ClimbVM[],
  filter: ClimbFilter,
  sort: ClimbSort
): ClimbVM[] {
  return climbs.filter(FILTERS[filter]).sort(SORTS[sort]);
}

export function postingStatus(status: ConnectionStatus | null): PostingStatus | null {
  if (status === null) return null;
  const strava = status.strava;
  if (strava === null) return { connected: false, active: false, since: null };
  return { connected: true, active: strava.status === "active", since: strava.postSince };
}

function postedLabel(session: SessionDetail, start: Date): string {
  const on = session.posted_at !== null ? new Date(session.posted_at) : start;
  const day = on
    .toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
    .toUpperCase();
  return `ON STRAVA · POSTED ${day}`;
}

export function postStatusVM(
  session: SessionDetail,
  posting: PostingStatus | null,
  start: Date
): PostStatusVM {
  const base = { detail: null, alert: false, action: null, actionLabel: null } as const;

  if (session.inProgress) {
    return { ...base, kind: "in-progress", label: "IN PROGRESS · POSTS WHEN THE SESSION SETTLES" };
  }
  if (session.strava_activity_id !== null) {
    return { ...base, kind: "posted", label: postedLabel(session, start) };
  }
  if (session.source !== "manual") {
    const board = BOARD_LABELS[session.board ?? ""] ?? "Board session";
    return { ...base, kind: "legacy", label: `${board.toUpperCase()} · READ-ONLY HISTORY` };
  }
  if (session.post_state === "pending") {
    return { ...base, kind: "pending", label: "POSTING TO STRAVA" };
  }

  // Nothing to post to: no action, and no explanation the user can act on.
  const postable = posting !== null && posting.connected && posting.active;

  if (session.post_state === "failed") {
    return {
      kind: "failed",
      label: "NOT POSTED TO STRAVA",
      detail: session.post_error,
      alert: true,
      action: postable ? "retry" : null,
      actionLabel: postable ? "Retry" : null,
    };
  }
  if (postable && posting.since !== null && session.start_at < posting.since) {
    return {
      kind: "before-start",
      label: "NOT POSTED TO STRAVA",
      detail: "Earlier than your posting start date",
      alert: false,
      action: "post",
      actionLabel: "Post anyway",
    };
  }
  return {
    kind: "off",
    label: "LOGGED MANUALLY",
    detail: null,
    alert: false,
    action: postable ? "post" : null,
    actionLabel: postable ? "Post to Strava" : null,
  };
}

export function sessionDetailVM(
  session: SessionDetail,
  posting: PostingStatus | null = null
): SessionDetailVM {
  const board = session.board;
  const climbs = climbVMs(session.climbs);
  const start = new Date(session.start_at);
  const sends = climbs.filter((c) => c.result !== "project");
  const flashes = climbs.filter((c) => c.result === "flash");
  const discipline = dominantDiscipline(session.climbs);
  const format = gradeFormatterFor(session.climbs, discipline);
  const inDiscipline = session.climbs.filter((c) => climbDiscipline(c) === discipline);
  const graded = inDiscipline.filter((c) => climbRank(c) >= 0);
  const avg =
    graded.length > 0 ? graded.reduce((a, c) => a + climbRank(c), 0) / graded.length : null;
  const top = topSendRank(inDiscipline);
  const topLabel =
    top >= 0
      ? format.label(top)
      : (session.top_send_grade_label ?? gradeLabel(session.top_send_grade));

  const titleLabel =
    session.name !== null && session.name !== ""
      ? session.name
      : session.source === "manual"
        ? "Logged session"
        : (BOARD_LABELS[board ?? ""] ?? "Board session");
  const dateLabel = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const weekday = start
    .toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })
    .toUpperCase();
  const time = start
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" })
    .toUpperCase();

  const stats: StatVM[] = [
    { label: "TIME", value: durationLabel(session.start_at, session.end_at), accent: false },
    { label: "CLIMBS", value: String(climbs.length), accent: false },
    { label: "SENDS", value: String(sends.length), accent: false },
    { label: "AVG GRADE", value: avg === null ? "-" : format.average(avg), accent: false },
    { label: "FLASHES", value: String(flashes.length), accent: false },
    { label: "RPE", value: `${session.rpe}/10`, accent: false },
    { label: "TOP", value: topLabel, accent: true },
  ];

  const grades = graded.map((c) => climbRank(c));
  const lo = grades.length > 0 ? Math.min(...grades) : 0;
  const hi = grades.length > 0 ? Math.max(...grades) : 0;
  const bars: GradeBarVM[] = [];
  if (grades.length > 0) {
    const counts = new Map<number, number>();
    for (const c of graded) {
      if (c.kind === "send") counts.set(climbRank(c), (counts.get(climbRank(c)) ?? 0) + 1);
    }
    const max = Math.max(1, ...counts.values());
    for (let g = lo; g <= hi; g++) {
      const count = counts.get(g) ?? 0;
      bars.push({
        gradeLabel: format.label(g),
        count,
        height: count === 0 ? 0 : count / max,
        peak: g === top && count > 0,
      });
    }
  }

  const filterCounts: SessionDetailVM["filterCounts"] = {
    all: climbs.length,
    sent: climbs.filter(FILTERS.sent).length,
    flash: climbs.filter(FILTERS.flash).length,
    project: climbs.filter(FILTERS.project).length,
  };

  const location = session.location === null ? "" : ` · ${session.location.toUpperCase()}`;

  return {
    title: `${titleLabel} - ${dateLabel}`,
    meta: `${weekday} ${dateLabel.toUpperCase()} · ${time} · ${durationLabel(session.start_at, session.end_at)}${location} · RPE ${session.rpe}/10`,
    editable: session.source === "manual",
    stats,
    bars,
    filterCounts,
    post: postStatusVM(session, posting, start),
    stravaUrl:
      session.strava_activity_id !== null
        ? `https://www.strava.com/activities/${session.strava_activity_id}`
        : null,
  };
}
