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
import { t } from "../i18n";
import { sameTagName } from "../sessions/tags";
import { durationLabel as lowerDurationLabel } from "../sessions/years";
import {
  DEFAULT_GRADE_PREFS,
  GRADE_SCALE_OPTIONS,
  sendStylesFor,
  type ClimbDraft,
  type ClimbOutcome,
  type ClimbStyle,
  type Discipline,
  type GradePrefs,
  type GradeScale,
  type LogSessionDraft,
} from "./types";

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

export function disciplineOf(scale: GradeScale): Discipline {
  return GRADE_SCALE_OPTIONS.find((o) => o.value === scale)?.discipline ?? "boulder";
}

export function scaleOptionsFor(discipline: Discipline): readonly GradeScale[] {
  return GRADE_SCALE_OPTIONS.filter((o) => o.discipline === discipline).map((o) => o.value);
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

export function emptyDraft(now: Date, prefs: GradePrefs = DEFAULT_GRADE_PREFS): LogSessionDraft {
  const start = new Date(Math.floor(now.getTime() / (5 * 60_000)) * 5 * 60_000);
  const end = new Date(start.getTime() + 60 * 60_000);
  return {
    name: "",
    date: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    startTime: hhmm(start),
    endTime: hhmm(end),
    location: "indoor",
    tags: [],
    notes: "",
    rpe: null,
    climbs: [newClimb("climb-1", prefs.boulder)],
  };
}

export function nextClimbKey(climbs: readonly ClimbDraft[]): string {
  return `climb-${Math.max(0, ...climbs.map((c) => Number(c.key.slice(6)) || 0)) + 1}`;
}

export function newClimb(key: string, scale: GradeScale): ClimbDraft {
  return {
    key,
    scale,
    grade: DEFAULT_GRADE[scale],
    name: "",
    kind: "attempt",
    style: "redpoint",
    tries: 1,
    note: "",
  };
}

export function climbOutcome(climb: ClimbDraft): ClimbOutcome {
  return climb.kind === "attempt" ? { kind: "attempt" } : { kind: "send", style: climb.style };
}

/** A flash or an onsight is one try by definition, so picking one settles the count. */
export function withClimbOutcome(climb: ClimbDraft, outcome: ClimbOutcome): ClimbDraft {
  if (outcome.kind === "attempt") return { ...climb, kind: "attempt" };
  const tries = outcome.style === "redpoint" ? climb.tries : 1;
  return { ...climb, kind: "send", style: outcome.style, tries };
}

/** A one-try send is a flash and a flash on more tries is not, so the count settles the style. */
export function withTries(climb: ClimbDraft, tries: number): ClimbDraft {
  const next = Math.min(99, Math.max(1, tries));
  if (climb.kind !== "send") return { ...climb, tries: next };
  if (next === 1)
    return { ...climb, tries: next, style: climb.style === "onsight" ? "onsight" : "flash" };
  return { ...climb, tries: next, style: "redpoint" };
}

/** Onsight is a route idea; a boulder carrying one from an earlier edit falls back to sent. */
function withClimbScaleStyle(climb: ClimbDraft): ClimbDraft {
  const allowed = sendStylesFor(disciplineOf(climb.scale));
  return allowed.includes(climb.style) ? climb : { ...climb, style: "redpoint" };
}

export function withTag(draft: LogSessionDraft, name: string): LogSessionDraft {
  const trimmed = name.trim();
  if (trimmed === "" || draft.tags.some((t) => sameTagName(t, trimmed))) return draft;
  return { ...draft, tags: [...draft.tags, trimmed] };
}

export function withoutTag(draft: LogSessionDraft, name: string): LogSessionDraft {
  return { ...draft, tags: draft.tags.filter((t) => !sameTagName(t, name)) };
}

export function withClimbScale(climb: ClimbDraft, scale: GradeScale): ClimbDraft {
  if (climb.scale === scale) return climb;
  return withClimbScaleStyle({
    ...climb,
    scale,
    grade: convertGrade(climb.grade, climb.scale, scale),
  });
}

export function withClimbDiscipline(
  climb: ClimbDraft,
  discipline: Discipline,
  prefs: GradePrefs
): ClimbDraft {
  return withClimbScale(climb, prefs[discipline]);
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function minutesOf(time: string): number {
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
}

const MAX_SESSION_MINUTES = 720;

export function durationMinutes(startTime: string, endTime: string): number | undefined {
  if (!TIME.test(startTime) || !TIME.test(endTime)) return undefined;
  const diff = minutesOf(endTime) - minutesOf(startTime);
  if (diff > 0) return diff;
  const overnight = diff + 24 * 60;
  return overnight <= MAX_SESSION_MINUTES ? overnight : undefined;
}

export function withStartTime(draft: LogSessionDraft, startTime: string): LogSessionDraft {
  const held = durationMinutes(draft.startTime, draft.endTime);
  if (held === undefined || !TIME.test(startTime)) return { ...draft, startTime };
  const endMinutes = (minutesOf(startTime) + held) % (24 * 60);
  const endTime = `${pad(Math.floor(endMinutes / 60))}:${pad(endMinutes % 60)}`;
  return { ...draft, startTime, endTime };
}

export function durationLabel(minutes: number): string {
  return lowerDurationLabel(minutes);
}

function topDraftGrade(draft: LogSessionDraft): Grade | undefined {
  let top: Grade | undefined;
  let topRank = -1;
  for (const c of draft.climbs) {
    const grade = draftGrade(c.grade, c.scale);
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
    t("common.climbCount", { count: draft.climbs.length }),
    `${t("logSession.sendCount", { count: sends })}, ${t("logSession.attemptCount", { count: attempts })}`,
  ];
  if (top !== undefined) parts.push(t("sessions.topGrade", { grade: formatGrade(top) }));
  const minutes = durationMinutes(draft.startTime, draft.endTime);
  if (minutes !== undefined) parts.push(durationLabel(minutes));
  return parts.join(" · ");
}

export function draftProblem(draft: LogSessionDraft): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) return t("logSession.pickDate");
  if (!TIME.test(draft.startTime) || !TIME.test(draft.endTime)) {
    return t("logSession.setTimes");
  }
  const minutes = durationMinutes(draft.startTime, draft.endTime);
  if (minutes === undefined) return t("logSession.endBeforeStart");
  if (minutes > MAX_SESSION_MINUTES) return t("logSession.tooLong");
  if (draft.climbs.length === 0) return t("logSession.needClimb");
  if (draft.climbs.some((c) => draftGrade(c.grade, c.scale) === undefined)) {
    return t("logSession.needGrade");
  }
  return null;
}

/** An endurance circuit is a send, redpoint, one try, and never a project. */
function climbOutcomeInput(
  c: ClimbDraft
): Pick<LogClimbInput, "kind" | "style" | "tries" | "endurance" | "project"> {
  if (c.endurance !== undefined) {
    return { kind: "send", style: "redpoint", tries: 1, endurance: c.endurance };
  }
  return {
    kind: c.kind,
    ...(c.kind === "send" ? { style: c.style } : {}),
    tries: c.tries,
    ...(c.project === undefined ? {} : { project: c.project }),
  };
}

export function toLogSessionInput(draft: LogSessionDraft): LogSessionInput {
  const climbs: LogClimbInput[] = draft.climbs.map((c) => ({
    ...(c.name.trim() === "" ? {} : { name: c.name.trim() }),
    grade: draftGrade(c.grade, c.scale) ?? fallbackGrade(c.grade, c.scale),
    ...climbOutcomeInput(c),
    ...(c.name.trim() === "" || c.note.trim() === "" ? {} : { note: c.note.trim() }),
    ...(c.circuit === undefined ? {} : { circuit: c.circuit }),
    ...(c.wall === undefined || c.wall.trim() === "" ? {} : { wall: c.wall.trim() }),
  }));
  return {
    ...(draft.name.trim() === "" ? {} : { name: draft.name.trim() }),
    date: draft.date,
    startTime: draft.startTime,
    endTime: draft.endTime,
    ...(draft.rpe === null ? {} : { rpe: draft.rpe }),
    location: draft.location,
    ...(draft.gymId === undefined ? {} : { gymId: draft.gymId }),
    ...(draft.tags.length === 0 ? {} : { tags: draft.tags }),
    ...(draft.notes.trim() === "" ? {} : { notes: draft.notes.trim() }),
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

/** Rows logged before send styles existed: a one-try send was a flash, whatever it was called. */
function storedStyle(climb: SessionClimb): ClimbStyle {
  if (climb.style !== undefined) return climb.style;
  return climb.kind === "send" && climb.tries <= 1 ? "flash" : "redpoint";
}

export function draftFromSession(session: SessionDetail): LogSessionDraft {
  const climbs = [...session.climbs].sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
  return {
    name: session.name ?? "",
    date: utcDate(session.start_at),
    startTime: utcTime(session.start_at),
    endTime: utcTime(session.end_at),
    location: session.location ?? "indoor",
    ...(session.gym_id === null ? {} : { gymId: session.gym_id }),
    tags: session.tags.map((t) => t.name),
    notes: session.notes ?? "",
    rpe: session.rpe,
    climbs: climbs.map((c, i) => {
      const scale = c.grade?.scale ?? "v";
      return {
        key: `climb-${i + 1}`,
        scale,
        grade: climbGrade(c, scale),
        name: c.name,
        note: c.note ?? "",
        ...(c.circuit === undefined ? {} : { circuit: c.circuit }),
        ...(c.wall === undefined ? {} : { wall: c.wall }),
        ...(c.endurance === undefined
          ? { kind: c.kind, style: storedStyle(c), tries: c.tries }
          : {
              kind: "send" as const,
              style: "redpoint" as const,
              tries: 1,
              endurance: c.endurance,
            }),
      };
    }),
  };
}
