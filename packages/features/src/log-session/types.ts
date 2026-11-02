import {
  disciplineOf,
  type ClimbStyle,
  type Discipline,
  type Endurance,
  type GradeScale,
} from "@sendtally/core";
import type { CircuitRef, PlanLink } from "@sendtally/api-client";
import { t } from "../i18n";

export type { ClimbStyle, Discipline, Endurance, GradeScale };
export { disciplineOf };

export type GradeScaleOption = { value: GradeScale; discipline: Discipline };

export const GRADE_SCALE_OPTIONS: readonly GradeScaleOption[] = [
  { value: "v", discipline: "boulder" },
  { value: "font", discipline: "boulder" },
  { value: "yds", discipline: "route" },
  { value: "french", discipline: "route" },
];

export function scaleLabel(scale: GradeScale): string {
  if (scale === "french") return t("logSession.scaleFrench");
  return scale === "font" ? "Font" : scale.toUpperCase();
}

export type GradePrefs = { boulder: GradeScale; route: GradeScale };

export const DEFAULT_GRADE_PREFS: GradePrefs = { boulder: "v", route: "yds" };

export function disciplineLabel(discipline: Discipline): string {
  return t(discipline === "route" ? "common.route" : "common.boulder");
}

export type ClimbDraft = {
  key: string;
  scale: GradeScale;
  grade: string;
  name: string;
  kind: "send" | "attempt";
  style: ClimbStyle;
  tries: number;
  note: string;
  project?: boolean;
  circuit?: CircuitRef;
  wall?: string;
  endurance?: Endurance;
  /** The Areas climb this row is linked to, set by picking or adding one and cleared by retyping. */
  climbId?: string;
  /** The user's own climb record this row is, once known; cleared by retyping the name. */
  userClimbId?: string;
  /** The workout item a climb logged on an exercise's tally belongs to, and its set from 1. */
  item?: number;
  set?: number;
};

/** The tally scoped to one exercise of a workout: its sets, what ends one, and where it is. */
export type ExerciseTally = {
  item: number;
  name: string;
  sets: number;
  /** Climbs that end a set; none runs it until Done. */
  climbs?: number;
  /** Time on the wall that ends a set. */
  onS?: number;
  restS: number;
  /** The set being climbed, from 1; past the last once every set is done. */
  set: number;
  /** When the set's time on the wall started, at its first grade. */
  setStartedAt?: string;
};

/**
 * What a climber picks per climb: how it went, in the vocabulary of its discipline.
 * A boulder is sent or flashed; a route is redpointed, flashed with beta, or
 * onsighted with none. An attempt is the same idea either way.
 */
export type ClimbOutcome = { kind: "send"; style: ClimbStyle } | { kind: "attempt" };

const OUTCOME_STYLES: Record<Discipline, readonly ClimbStyle[]> = {
  boulder: ["redpoint", "flash"],
  route: ["redpoint", "flash", "onsight"],
};

export function sendStylesFor(discipline: Discipline): readonly ClimbStyle[] {
  return OUTCOME_STYLES[discipline];
}

/** Only a redpoint is named differently by discipline: a boulder is just sent. */
export function sendStyleLabel(discipline: Discipline, style: ClimbStyle): string {
  if (style === "flash") return t("logSession.styleFlash");
  if (style === "onsight") return t("logSession.styleOnsight");
  return t(discipline === "route" ? "logSession.styleRedpoint" : "logSession.styleSent");
}

export type LogSessionDraft = {
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  /** When a live session started, to the second, for its running clock. */
  startedAt?: string;
  location: "indoor" | "outdoor";
  gymId?: string;
  /** The crag an outdoor session was at, from Areas. */
  area?: { id: string; name: string };
  tags: string[];
  notes: string;
  rpe: number | null;
  climbs: ClimbDraft[];
  /** The planned day this session was started from. */
  plan?: PlanLink;
  /** The workout exercise it logs, which makes it part of that workout and never a session. */
  exercise?: ExerciseTally;
};
