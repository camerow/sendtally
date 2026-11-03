import { disciplineOf, parseGrade, sessionMinutes } from "@sendtally/core";
import { z } from "zod";
import { CIRCUIT_COLOURS } from "./gyms";
import { calendarDate, focus, id, MAX_BLOCK_WEEKS } from "./plan";
import { tagNames, tagSlug } from "./tags";

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

export const CLIMB_NOTE_MAX = 2000;

// Where a gym climb was: the circuit it is on (a snapshot, so a gym edit never
// rewrites history) and the wall, both optional and both only meaningful when
// the session names a gym.
const circuitRefSchema = z.object({
  id: z.string().min(1).max(40),
  label: z.string().max(40),
  colour: z.enum(CIRCUIT_COLOURS),
});

const climbSchema = z
  .object({
    name: z.string().max(200).default(""),
    climbId: z.string().min(1).max(64).optional(),
    userClimbId: z.string().min(1).max(64).optional(),
    grade: gradeSchema,
    circuit: circuitRefSchema.optional(),
    wall: z.string().trim().max(40).optional(),
    kind: z.enum(["send", "attempt"]).default("send"),
    style: z.enum(["redpoint", "flash", "onsight"]).optional(),
    tries: z.number().int().min(1).max(99).default(1),
    project: z.boolean().optional(),
    note: z.string().max(CLIMB_NOTE_MAX).optional(),
    endurance: z
      .object({
        unit: z.enum(["moves", "seconds"]),
        target: z.number().int().min(1).max(3600),
        laps: z.array(z.number().int().min(0).max(3600)).min(1).max(60),
      })
      .optional(),
  })
  .superRefine((climb, ctx) => {
    const endurance = climb.endurance;
    if (endurance !== undefined) {
      if (endurance.laps.some((lap) => lap > endurance.target)) {
        ctx.addIssue({
          code: "custom",
          path: ["endurance", "laps"],
          message: "a lap cannot beat its target",
        });
      }
      if (climb.kind !== "send") {
        ctx.addIssue({ code: "custom", path: ["kind"], message: "an endurance climb is a send" });
      }
      if (climb.style !== undefined && climb.style !== "redpoint") {
        ctx.addIssue({
          code: "custom",
          path: ["style"],
          message: "an endurance climb has no send style",
        });
      }
      if (climb.tries !== 1) {
        ctx.addIssue({ code: "custom", path: ["tries"], message: "an endurance climb is one try" });
      }
    }
    if (climb.style === undefined) return;
    if (climb.kind === "attempt") {
      ctx.addIssue({ code: "custom", path: ["style"], message: "an attempt has no send style" });
      return;
    }
    if (climb.style === "onsight" && disciplineOf(climb.grade.scale) !== "route") {
      ctx.addIssue({ code: "custom", path: ["style"], message: "only routes are onsighted" });
    }
    if (climb.style !== "redpoint" && climb.tries !== 1) {
      ctx.addIssue({ code: "custom", path: ["tries"], message: "a flash or onsight is one try" });
    }
  });

export const NOTE_MAX = 2000;

const sessionNote = z.string().max(NOTE_MAX).optional();

export const climbNoteBody = z.object({ note: z.string().max(CLIMB_NOTE_MAX).optional() });

export const userClimbNoteParam = z.object({ id, noteId: id });

export const userClimbNoteBody = z.object({
  day: calendarDate,
  note: z.string().trim().min(1).max(CLIMB_NOTE_MAX),
});

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
  location: z.enum(["indoor", "outdoor"]).optional(),
  unscored: z.boolean().optional(),
  gymId: z.string().min(1).max(40).optional(),
  areaId: z.string().min(1).max(64).optional(),
  tags: tagNames.optional(),
  notes: sessionNote,
  climbs: z.array(climbSchema).min(1).max(300),
  // The plan the session ran; absent on an edit keeps the link it had.
  membershipId: id.nullable().optional(),
  week: z.number().int().min(1).max(MAX_BLOCK_WEEKS).nullable().optional(),
  // Absent on an edit keeps the focus it had.
  focus,
});

export function sessionTooLong(
  body: { startTime?: string | undefined; endTime?: string | undefined },
  ctx: z.RefinementCtx
): void {
  if (sessionMinutes(body) > 720) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endTime"], message: "session too long" });
  }
}

// A link is keyed by the slug of the logged name, so a linked climb needs a
// name and two rows with one name cannot point at different climbs.
function linksConsistent(body: ManualSessionBody, ctx: z.RefinementCtx): void {
  if (body.areaId !== undefined && body.location === "indoor") {
    ctx.addIssue({
      code: "custom",
      path: ["areaId"],
      message: "only outdoor sessions have a crag",
    });
  }
  const idBySlug = new Map<string, string>();
  body.climbs.forEach((climb, i) => {
    if (climb.climbId === undefined) return;
    const slug = tagSlug(climb.name.trim());
    const seen = idBySlug.get(slug);
    if (slug === "" || (seen !== undefined && seen !== climb.climbId)) {
      ctx.addIssue({ code: "custom", path: ["climbs", i, "climbId"], message: "conflicting link" });
    }
    idBySlug.set(slug, climb.climbId);
  });
}

export const manualSessionBody = manualSessionShape.superRefine((body, ctx) => {
  sessionTooLong(body, ctx);
  linksConsistent(body, ctx);
});

export const newManualSessionBody = manualSessionBody.safeExtend({
  fingerprint: z
    .string()
    .regex(/^manual-[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/)
    .optional(),
});

export type ClimbLink = { climb_slug: string; climb_id: string };

export function climbLinksOf(climbs: ManualSessionBody["climbs"]): ClimbLink[] {
  const bySlug = new Map<string, ClimbLink>();
  for (const { name, climbId } of climbs) {
    if (climbId === undefined) continue;
    const climb_slug = tagSlug(name.trim());
    bySlug.set(climb_slug, { climb_slug, climb_id: climbId });
  }
  return [...bySlug.values()];
}

export type ManualSessionBody = z.infer<typeof manualSessionShape>;

export {
  buildManualSession,
  historySession,
  parseClimbs,
  type CircuitRef,
  type StoredClimb,
} from "@sendtally/core";

// What the log-session form sends. Derived from the validator, so a schema
// change reaches the apps as a type error rather than a runtime rejection.
export type LogSessionInput = z.input<typeof manualSessionShape>;

export type LogClimbInput = LogSessionInput["climbs"][number];
