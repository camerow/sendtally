import type {
  Area,
  AreaClimb,
  AreaClimbPage,
  AreaClimbSession,
  AreaDraft,
  AreaPage,
  AreaRedirect,
  AreaSummary,
} from "@sendtally/api-client";

export type {
  Area,
  AreaClimb,
  AreaClimbPage,
  AreaClimbSession,
  AreaDraft,
  AreaPage,
  AreaRedirect,
  AreaSummary,
};

export type ClimbType = AreaClimb["type"];

export type ClimbFact = { label: string; value: string };

export type ClimbSessionVM = {
  fingerprint: string;
  title: string;
  dateLabel: string;
  sent: boolean;
};

/** What the add and suggest-edit forms hold for a climb, as the user typed it. */
export type ClimbFormValues = {
  name: string;
  type: ClimbType;
  gradeScale: AreaClimb["grade_scale"];
  grade: string;
  lengthM: string;
  bolts: string;
  firstAscent: string;
  description: string;
};

/** What the add and suggest-edit forms hold for an area. Coordinates stay text until saved. */
export type AreaFormValues = {
  name: string;
  description: string;
  lat: string;
  lon: string;
};
