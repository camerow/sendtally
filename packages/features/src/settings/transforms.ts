import type { ConnectionStatus } from "@sendtally/api-client";
import type { SettingsVM } from "./types";

// post_since is stored as a wall-clock timestamp; the date input wants YYYY-MM-DD.
export function toDateInput(postSince: string | null): string {
  return postSince === null ? "" : postSince.slice(0, 10);
}

export function settingsVM(status: ConnectionStatus | null): SettingsVM {
  const strava = status?.strava ?? null;
  const stravaActive = strava?.status === "active";
  return {
    stravaConnected: strava !== null,
    stravaActive,
    stravaStatusLabel:
      strava === null ? "NOT CONNECTED" : stravaActive ? "CONNECTED" : "RECONNECT NEEDED",
    postingEnabled: strava?.postingEnabled ?? false,
    postSince: toDateInput(strava?.postSince ?? null),
  };
}

export const DELETE_CONFIRMATION_WORD = "DELETE";

export function deleteConfirmationMatches(input: string): boolean {
  return input.trim().toUpperCase() === DELETE_CONFIRMATION_WORD;
}
