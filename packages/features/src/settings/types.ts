import type { GradeScales } from "@sendtally/api-client";

export type SettingsVM = {
  ready: boolean;
  gradeScales: GradeScales;
  stravaConnected: boolean;
  stravaActive: boolean;
  stravaStatusLabel: string;
  headerBadge: string;
  postingEnabled: boolean;
  postSince: string;
};

export type DeleteAccountStatus = "idle" | "confirming" | "deleting" | "deleted";
