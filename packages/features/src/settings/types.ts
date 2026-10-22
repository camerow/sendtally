import type { GradeScales } from "@sendtally/api-client";

export type SettingsVM = {
  gradeScales: GradeScales;
  stravaConnected: boolean;
  stravaActive: boolean;
  stravaStatusLabel: string;
  postingEnabled: boolean;
  postSince: string;
  postTraining: boolean;
};

export type DeleteAccountStatus = "idle" | "confirming" | "deleting" | "deleted";
