import type { Discipline, GradeScale } from "@sendtally/core";

export type { Discipline, GradeScale };

export type GradeScaleOption = { value: GradeScale; label: string; discipline: Discipline };

export const GRADE_SCALE_OPTIONS: readonly GradeScaleOption[] = [
  { value: "v", label: "V", discipline: "boulder" },
  { value: "font", label: "FONT", discipline: "boulder" },
  { value: "yds", label: "YDS", discipline: "route" },
  { value: "french", label: "FRENCH", discipline: "route" },
];

export type ClimbDraft = {
  key: string;
  grade: string;
  name: string;
  kind: "send" | "attempt";
  tries: number;
};

export type LogSessionDraft = {
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  location: "indoor" | "outdoor";
  tags: string[];
  scale: GradeScale;
  rpe: number | null;
  climbs: ClimbDraft[];
};
