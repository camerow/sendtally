import type { Discipline, GradeScale } from "@sendtally/core";

export type { Discipline, GradeScale };

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
  tries: number;
  project?: boolean;
};

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
