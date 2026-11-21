import type { ClimbKind, ClimbStyle } from "../effort";
import type { Grade, GradeScale } from "../grades";

export type ImportFormat =
  "kaya" | "8a" | "mountainProject" | "sendage" | "theCrag" | "sendtally" | "spreadsheet";

export type ImportIssueCode =
  | "noHeader"
  | "missingDate"
  | "noDate"
  | "badDate"
  | "missingGrade"
  | "unknownGrade"
  | "badKind"
  | "badStyle"
  | "badTries"
  | "badRpe"
  | "badLocation"
  | "badTime"
  | "badMinutes"
  | "unreadColumn";

export type ImportIssue = {
  row: number;
  code: ImportIssueCode;
  value?: string;
  climb?: string;
};

export type ImportClimb = {
  name: string;
  grade: Grade;
  kind: ClimbKind;
  style?: ClimbStyle;
  tries: number;
  wall?: string;
  note?: string;
};

// One session as the import endpoint takes it: the log form's body with the
// gym as a name rather than an id, since a CSV cannot know our ids.
export type ImportSession = {
  date: string;
  name?: string;
  location: "indoor" | "outdoor";
  gym?: string;
  startTime?: string;
  endTime?: string;
  minutes?: number;
  rpe?: number;
  tags?: string[];
  notes?: string;
  climbs: ImportClimb[];
  rows: number[];
};

export type ImportPlan = {
  format: ImportFormat;
  sessions: ImportSession[];
  issues: ImportIssue[];
};

export type ClimbResult = "send" | "attempt" | "flash" | "onsight" | "redpoint";

export type GradeColumn = { column: string; scale: GradeScale | null };

// Which of a spreadsheet's columns holds each of our fields, by header name, as the
// column-matching endpoint answers it and the user edits it.
export type ColumnMatch = {
  date: string;
  climb: string | null;
  grade: GradeColumn;
  otherGrade: GradeColumn | null;
  result: { column: string; values: { value: string; means: ClimbResult }[] } | null;
  tries: string | null;
  where: { column: string; kind: "gym" | "crag" } | null;
  notes: string | null;
};

export type DateOrder = "dmy" | "mdy";
