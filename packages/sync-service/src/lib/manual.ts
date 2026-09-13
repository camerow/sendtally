import {
  defaultEffortConfig,
  effortGrade,
  parseGrade,
  score,
  topGradeLabel,
  type Climb,
  type ClimbKind,
  type ClimbStyle,
  type Grade,
  type Session,
} from "@sendtally/core";
import { z } from "zod";
import type { ManualSessionInput, SessionRow } from "./repo";
import { tagNames } from "./tags";

const knownGrade =
  (scale: "font" | "yds" | "french") =>
  (value: string): boolean =>
    parseGrade(scale, value) !== undefined;

const gradeSchema = z.union([
  z.object({ scale: z.literal("v"), value: z.number().int().min(0).max(17) }),
  z.object({
    scale: z.literal("font"),
    value: z.string().refine(knownGrade("font"), "unknown Font grade"),
  }),
  z.object({
    scale: z.literal("yds"),
    value: z.string().refine(knownGrade("yds"), "unknown YDS grade"),
  }),
  z.object({
    scale: z.literal("french"),
    value: z.string().refine(knownGrade("french"), "unknown French grade"),
  }),
]);

const climbSchema = z
  .object({
    name: z.string().max(200).default(""),
    grade: gradeSchema,
    kind: z.enum(["send", "attempt"]).default("send"),
    style: z.enum(["redpoint", "flash", "onsight"]).optional(),
    tries: z.number().int().min(1).max(99).default(1),
    project: z.boolean().optional(),
  })
  .superRefine((climb, ctx) => {
    if (climb.style === undefined) return;
    if (climb.kind === "attempt") {
      ctx.addIssue({ code: "custom", path: ["style"], message: "an attempt has no send style" });
      return;
    }
    if (
      climb.style === "onsight" &&
      climb.grade.scale !== "yds" &&
      climb.grade.scale !== "french"
    ) {
      ctx.addIssue({ code: "custom", path: ["style"], message: "only routes are onsighted" });
    }
    if (climb.style !== "redpoint" && climb.tries !== 1) {
      ctx.addIssue({ code: "custom", path: ["tries"], message: "a flash or onsight is one try" });
    }
  });

export const NOTE_MAX = 2000;

const sessionNote = z.string().max(NOTE_MAX).optional();

export const sessionNotesBody = z.object({ notes: sessionNote });

export function normalisedNote(notes: string | undefined): string | null {
  const trimmed = notes?.trim() ?? "";
  return trimmed === "" ? null : trimmed;
}

export const manualSessionShape = z.object({
  name: z.string().min(1).max(120).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((d) => {
      const t = Date.parse(`${d}T00:00:00Z`);
      return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === d;
    }, "invalid date"),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional(),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional(),
  rpe: z.number().int().min(1).max(10).optional(),
  location: z.enum(["indoor", "outdoor"]),
  tags: tagNames.optional(),
  notes: sessionNote,
  climbs: z.array(climbSchema).min(1).max(300),
});

export const manualSessionBody = manualSessionShape.superRefine((body, ctx) => {
  if (sessionMinutes(body) > 720) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endTime"], message: "session too long" });
  }
});

export type ManualSessionBody = z.infer<typeof manualSessionShape>;

const DEFAULT_START = "12:00";
const DEFAULT_DURATION_MINUTES = 90;

function minutesOf(hhmm: string): number {
  return Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
}

function sessionMinutes(body: {
  startTime?: string | undefined;
  endTime?: string | undefined;
}): number {
  if (body.endTime === undefined) return DEFAULT_DURATION_MINUTES;
  const diff = minutesOf(body.endTime) - minutesOf(body.startTime ?? DEFAULT_START);
  return diff > 0 ? diff : diff + 24 * 60;
}

type ManualGrade = z.infer<typeof gradeSchema>;

function normalisedGrade(grade: ManualGrade): Grade {
  if (grade.scale === "v") return grade;
  return parseGrade(grade.scale, grade.value) ?? grade;
}

function toSession(body: ManualSessionBody): Session {
  const start = new Date(`${body.date}T${body.startTime ?? DEFAULT_START}:00Z`);
  const durationMs = sessionMinutes(body) * 60_000;
  const end = new Date(start.getTime() + durationMs);
  const step = durationMs / Math.max(body.climbs.length - 1, 1);
  const climbs: Climb[] = body.climbs.map((c, i) => {
    const grade = normalisedGrade(c.grade);
    return {
      time: new Date(start.getTime() + Math.round(step * i)),
      vGrade: effortGrade(grade),
      name: c.name,
      kind: c.kind,
      ...(c.style === undefined ? {} : { style: c.style }),
      tries: c.tries,
      grade,
    };
  });
  return { start, end, climbs };
}

// The shape `climbs_json` holds: every climb the user logged, as written by
// buildManualSession and read back by the session endpoints.
export type StoredClimb = {
  time: string;
  name: string;
  vGrade: number;
  kind: ClimbKind;
  style?: ClimbStyle;
  tries: number;
  angle: number | null;
  grade?: Grade;
};

export function parseClimbs(climbsJson: string | null | undefined): StoredClimb[] {
  return climbsJson == null ? [] : (JSON.parse(climbsJson) as StoredClimb[]);
}

export function historySession(row: SessionRow & { climbs_json?: string | null }): Session | null {
  if (row.climbs_json == null) return null;
  return {
    start: new Date(row.start_at),
    end: new Date(row.end_at),
    climbs: parseClimbs(row.climbs_json).map((c) => ({
      time: new Date(c.time),
      vGrade: c.vGrade,
      name: c.name,
      kind: c.kind,
      tries: c.tries,
    })),
  };
}

export function buildManualSession(
  fingerprint: string,
  body: ManualSessionBody,
  history: Session[]
): ManualSessionInput {
  const session = toSession(body);
  const result = score(session, history, defaultEffortConfig(), body.rpe);
  const topGrade = session.climbs.reduce((hi, c) => (c.vGrade > hi ? c.vGrade : hi), -1);
  const topSendGrade = session.climbs.reduce(
    (hi, c) => (c.kind === "send" && c.vGrade > hi ? c.vGrade : hi),
    -1
  );
  const sends = session.climbs.filter((c) => c.kind === "send");
  return {
    fingerprint,
    location: body.location,
    name: body.name ?? null,
    start_at: session.start.toISOString(),
    end_at: session.end.toISOString(),
    climb_count: session.climbs.length,
    top_grade: topGrade,
    top_send_grade: topSendGrade,
    top_grade_label: topGradeLabel(session.climbs) ?? null,
    top_send_grade_label: topGradeLabel(sends) ?? null,
    rpe: result.rpe,
    title: body.name ?? result.title,
    summary: result.summary,
    notes: normalisedNote(body.notes),
    climbs_json: JSON.stringify(
      session.climbs.map((c): StoredClimb => ({
        time: c.time.toISOString(),
        name: c.name,
        vGrade: c.vGrade,
        kind: c.kind,
        ...(c.style === undefined ? {} : { style: c.style }),
        tries: c.tries,
        angle: null,
        grade: c.grade,
      }))
    ),
  };
}

// What the log-session form sends. Derived from the validator, so a schema
// change reaches the apps as a type error rather than a runtime rejection.
export type LogSessionInput = z.input<typeof manualSessionShape>;

export type LogClimbInput = LogSessionInput["climbs"][number];
