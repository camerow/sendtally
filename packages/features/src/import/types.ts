import type { LogClimbInput } from "@sendtally/api-client";

export type ImportFormat = "kaya" | "sendtally";

export type ImportIssueCode =
  | "noHeader"
  | "missingDate"
  | "badDate"
  | "missingGrade"
  | "unknownGrade"
  | "badKind"
  | "badStyle"
  | "badTries"
  | "badRpe"
  | "badLocation"
  | "badTime";

export type ImportIssue = {
  row: number;
  code: ImportIssueCode;
  value?: string;
  climb?: string;
};

export type ImportClimb = Pick<LogClimbInput, "name" | "grade" | "kind" | "style" | "tries"> & {
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
