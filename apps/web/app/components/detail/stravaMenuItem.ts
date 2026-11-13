import { stravaLabel, type StravaState } from "@sendtally/features/activities";
import type { MoreMenuItem } from "../MoreMenu";

/** A finished workout's Strava row in its ··· menu: connect, post, retry or view, as the state says. */
export const stravaMenuItem = (state: StravaState, onSelect: () => void): MoreMenuItem => ({
  label: stravaLabel(state),
  onSelect,
  disabled: state.kind === "posting",
});
