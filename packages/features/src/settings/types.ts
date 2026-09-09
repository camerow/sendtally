export type SettingsVM = {
  stravaConnected: boolean;
  stravaActive: boolean;
  stravaStatusLabel: string;
  headerBadge: string;
  postingEnabled: boolean;
  postSince: string;
};

export type DeleteAccountStatus = "idle" | "confirming" | "deleting" | "deleted";
