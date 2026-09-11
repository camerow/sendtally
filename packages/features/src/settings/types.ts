export type SettingsVM = {
  stravaConnected: boolean;
  stravaActive: boolean;
  stravaStatusLabel: string;
  postingEnabled: boolean;
  postSince: string;
};

export type DeleteAccountStatus = "idle" | "confirming" | "deleting" | "deleted";
