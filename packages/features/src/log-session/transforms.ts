import {
  FONT_GRADES,
  FRENCH_GRADES,
  YDS_GRADES,
  climbRank,
  convertGrade as convertCoreGrade,
  effortGrade,
  formatGrade,
  parseGrade,
  type Grade,
} from "@sendtally/core";
import type {
  LogClimbInput,
  LogSessionInput,
  SessionClimb,
  SessionDetail,
} from "@sendtally/api-client";
import { sameTagName } from "../sessions/tags";
import type { ClimbDraft, GradeScale, LogSessionDraft } from "./types";

export const V_GRADE_OPTIONS: readonly string[] = Array.from({ length: 18 }, (_, i) => `V${i}`);

export const FONT_GRADE_OPTIONS: readonly string[] = FONT_GRADES.filter(
  (g) => !["1", "2", "3"].includes(g)
);

export const YDS_GRADE_OPTIONS: readonly string[] = YDS_GRADES;

export const FRENCH_GRADE_OPTIONS: readonly string[] = FRENCH_GRADES;

const GRADE_OPTIONS: Record<GradeScale, readonly string[]> = {
  v: V_GRADE_OPTIONS,
  font: FONT_GRADE_OPTIONS,
  yds: YDS_GRADE_OPTIONS,
  french: FRENCH_GRADE_OPTIONS,
};

const DEFAULT_GRADE: Record<GradeScale, string> = {
  v: "V3",
  font: "6A",
  yds: "5.10b",
  french: "6a",
};

export function gradeOptions(scale: GradeScale): readonly string[] {
  return GRADE_OPTIONS[scale];
}

export function draftGrade(grade: string, scale: GradeScale): Grade | undefined {
  const parsed = parseGrade(scale, grade);
  if (parsed === undefined) return undefined;
  if (parsed.scale === "v" && parsed.value > 17) return undefined;
  return parsed;
}

export function vGradeOf(grade: string, scale: GradeScale): number | undefined {
  const parsed = draftGrade(grade, scale);
  return parsed === undefined ? undefined : effortGrade(parsed);
}

export function convertGrade(grade: string, from: GradeScale, to: GradeScale): string {
  if (from === to) return grade;
  const parsed = draftGrade(grade, from);
  if (parsed === undefined) return grade;
  const converted = convertCoreGrade(parsed, to);
  return converted === undefined ? grade : formatGrade(converted);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function hhmm(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function emptyDraft(now: Date): LogSessionDraft {
  const roundedNow = new Date(Math.floor(now.getTime() / (5 * 60_000)) * 5 * 60_000);
  const start = new Date(roundedNow.getTime() - 90 * 60_000);
  return {
    name: "",
    date: `${roundedNow.getFullYear()}-${pad(roundedNow.getMonth() + 1)}-${pad(roundedNow.getDate())}`,
    startTime: hhmm(start),
    endTime: hhmm(roundedNow),
    location: "indoor",
    tags: [],
    scale: "v",
    rpe: null,
    climbs: [newClimb("climb-1", "v")],
  };
}

export function newClimb(key: string, scale: GradeScale): ClimbDraft {
  return { key, grade: DEFAULT_GRADE[scale], name: "", kind: "send", tries: 1 };
}

export function withTag(draft: LogSessionDraft, name: string): LogSessionDraft {
  const trimmed = name.trim();
  if (trimmed === "" || draft.tags.some((t) => sameTagName(t, trimmed))) return draft;
  return { ...draft, tags: [...draft.tags, trimmed] };
}

export function withoutTag(draft: LogSessionDraft, name: string): LogSessionDraft {
  return { ...draft, tags: draft.tags.filter((t) => !sameTagName(t, name)) };
}

export function withScale(draft: LogSessionDraft, scale: GradeScale): LogSessionDraft {
  return {
    ...draft,
    scale,
    climbs: draft.climbs.map((c) => ({ ...c, grade: convertGrade(c.grade, draft.scale, scale) })),
  };
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function minutesOf(time: string): number {
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
}

export function durationMinutes(startTime: string, endTime: string): number | undefined {
  if (!TIME.test(startTime) || !TIME.test(endTime)) return undefined;
  const diff = minutesOf(endTime) - minutesOf(startTime);
  return diff > 0 ? diff : diff + 24 * 60;
}

export function durationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}M`;
  return m === 0 ? `${h}H` : `${h}H ${pad(m)}M`;
}

function topDraftGrade(draft: LogSessionDraft): Grade | undefined {
  let top: Grade | undefined;
  let topRank = -1;
  for (const c of draft.climbs) {
    const grade = draftGrade(c.grade, draft.scale);
    if (grade === undefined) continue;
    const rank = climbRank({ vGrade: effortGrade(grade), grade });
    if (rank > topRank) {
      topRank = rank;
      top = grade;
    }
  }
  return top;
}

export function draftSummary(draft: LogSessionDraft): string {
  const sends = draft.climbs.filter((c) => c.kind === "send").length;
  const attempts = draft.climbs.length - sends;
  const top = topDraftGrade(draft);
  const parts = [
    `${draft.climbs.length} ${draft.climbs.length === 1 ? "CLIMB" : "CLIMBS"}`,
    `${sends} ${sends === 1 ? "SEND" : "SENDS"}, ${attempts} ${attempts === 1 ? "ATTEMPT" : "ATTEMPTS"}`,
  ];
  if (top !== undefined) parts.push(`TOP ${formatGrade(top)}`);
  const minutes = durationMinutes(draft.startTime, draft.endTime);
  if (minutes !== undefined) parts.push(durationLabel(minutes));
  return parts.join(" · ");
}

export function draftProblem(draft: LogSessionDraft): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) return "Pick a date.";
  if (!TIME.test(draft.startTime) || !TIME.test(draft.endTime)) {
    return "Set a start and end time.";
  }
  const minutes = durationMinutes(draft.startTime, draft.endTime);
  if (minutes === undefined || minutes > 720) {
    return "Sessions longer than 12 hours can't be logged.";
  }
  if (draft.climbs.length === 0) return "Add at least one climb.";
  if (draft.climbs.some((c) => draftGrade(c.grade, draft.scale) === undefined)) {
    return "Every climb needs a grade.";
  }
  return null;
}

export function toLogSessionInput(draft: LogSessionDraft): LogSessionInput {
  const climbs: LogClimbInput[] = draft.climbs.map((c) => ({
    ...(c.name.trim() === "" ? {} : { name: c.name.trim() }),
    grade: draftGrade(c.grade, draft.scale) ?? fallbackGrade(c.grade, draft.scale),
    kind: c.kind,
    tries: c.tries,
    ...(c.project === undefined ? {} : { project: c.project }),
  }));
  return {
    ...(draft.name.trim() === "" ? {} : { name: draft.name.trim() }),
    date: draft.date,
    startTime: draft.startTime,
    endTime: draft.endTime,
    ...(draft.rpe === null ? {} : { rpe: draft.rpe }),
    location: draft.location,
    ...(draft.tags.length === 0 ? {} : { tags: draft.tags }),
    climbs,
  };
}

function fallbackGrade(grade: string, scale: GradeScale): Grade {
  return scale === "v" ? { scale, value: 0 } : { scale, value: grade };
}

function utcTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

function utcDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function climbGrade(climb: SessionClimb, scale: GradeScale): string {
  const stored: Grade = climb.grade ?? { scale: "v", value: Math.max(0, climb.vGrade) };
  return convertGrade(formatGrade(stored), stored.scale, scale);
}

export function draftFromSession(session: SessionDetail): LogSessionDraft {
  const climbs = [...session.climbs].sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
  const scale: GradeScale = climbs.find((c) => c.grade !== undefined)?.grade?.scale ?? "v";
  return {
    name: session.name ?? "",
    date: utcDate(session.start_at),
    startTime: utcTime(session.start_at),
    endTime: utcTime(session.end_at),
    location: session.location ?? "indoor",
    tags: session.tags.map((t) => t.name),
    scale,
    rpe: session.rpe,
    climbs: climbs.map((c, i) => ({
      key: `climb-${i + 1}`,
      grade: climbGrade(c, scale),
      name: c.name,
      kind: c.kind,
      tries: c.tries,
    })),
  };
}
