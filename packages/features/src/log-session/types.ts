import { disciplineOf, type ClimbStyle, type Discipline, type GradeScale } from "@sendtally/core";

export type { ClimbStyle, Discipline, GradeScale };
export { disciplineOf };

export type GradeScaleOption = { value: GradeScale; label: string; discipline: Discipline };

export const GRADE_SCALE_OPTIONS: readonly GradeScaleOption[] = [
  { value: "v", label: "V", discipline: "boulder" },
  { value: "font", label: "FONT", discipline: "boulder" },
  { value: "yds", label: "YDS", discipline: "route" },
  { value: "french", label: "FRENCH", discipline: "route" },
];

export type GradePrefs = { boulder: GradeScale; route: GradeScale };

export const DEFAULT_GRADE_PREFS: GradePrefs = { boulder: "v", route: "yds" };

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  boulder: "Boulders",
  route: "Routes",
};

export type ClimbDraft = {
  key: string;
  scale: GradeScale;
  grade: string;
  name: string;
  kind: "send" | "attempt";
  style: ClimbStyle;
  tries: number;
  project?: boolean;
};

/**
 * What a climber picks per climb: how it went, in the vocabulary of its discipline.
 * A boulder is sent or flashed; a route is redpointed, flashed with beta, or
 * onsighted with none. An attempt is the same idea either way.
 */
export type ClimbOutcome = { kind: "send"; style: ClimbStyle } | { kind: "attempt" };

const OUTCOME_LABELS: Record<Discipline, Record<ClimbStyle, string>> = {
  boulder: { redpoint: "SENT", flash: "FLASH", onsight: "ONSIGHT" },
  route: { redpoint: "REDPOINT", flash: "FLASH", onsight: "ONSIGHT" },
};

const OUTCOME_STYLES: Record<Discipline, readonly ClimbStyle[]> = {
  boulder: ["redpoint", "flash"],
  route: ["redpoint", "flash", "onsight"],
};

export function sendStylesFor(discipline: Discipline): readonly ClimbStyle[] {
  return OUTCOME_STYLES[discipline];
}

export function sendStyleLabel(discipline: Discipline, style: ClimbStyle): string {
  return OUTCOME_LABELS[discipline][style];
}

export type LogSessionDraft = {
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  location: "indoor" | "outdoor";
  tags: string[];
  notes: string;
  rpe: number | null;
  climbs: ClimbDraft[];
};
