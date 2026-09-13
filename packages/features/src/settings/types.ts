import type { GradeScales } from "@sendtally/api-client";

export type SettingsVM = {
  gradeScales: GradeScales;
  stravaConnected: boolean;
  stravaActive: boolean;
  stravaStatusLabel: string;
  postingEnabled: boolean;
  postSince: string;
};

export type DeleteAccountStatus = "idle" | "confirming" | "deleting" | "deleted";
