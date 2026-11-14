import React from "react";
import { postedTime, type StravaState } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";

/** Where a posted, posting or failed workout stands with Strava; nothing before a post. */
export function StravaStatusRow({ state }: { state: StravaState }): React.ReactElement | null {
  if (state.kind === "connect" || state.kind === "post") return null;
  const failed = state.kind === "failed";
  const label =
    state.kind === "posted"
      ? t("summary.onStrava")
      : failed
        ? t("summary.postFailed")
        : t("summary.posting");
  const aside =
    state.kind === "posted"
      ? state.postedAt === null
        ? null
        : t("summary.postedAt", { time: postedTime(state.postedAt) })
      : failed
        ? state.reason
        : null;
  return (
    <div className={failed ? "strava-row strava-row--failed" : "strava-row"} role="status">
      <span className={state.kind === "posting" ? "strava-dot strava-dot--busy" : "strava-dot"} />
      <span className="strava-row-label">{label}</span>
      {aside !== null && <span className="strava-row-aside">{aside}</span>}
    </div>
  );
}
