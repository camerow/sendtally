import { stravaLabel, type StravaState } from "@sendtally/features/activities";
import type { DetailMenuRow } from "../components/types";

/** A finished workout's Strava row: connect, post, retry or view, as the state says. */
export function stravaRow(state: StravaState, onPress: () => void): DetailMenuRow {
  const row = { icon: "strava", title: stravaLabel(state), onPress } as const;
  switch (state.kind) {
    case "post":
      return { ...row, keepOpen: true };
    case "posting":
      return { ...row, busy: true, keepOpen: true };
    case "failed":
      return { ...row, ...(state.reason != null && { hint: state.reason }), keepOpen: true };
    default:
      return row;
  }
}
