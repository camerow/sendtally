import React from "react";
import { Link } from "react-router";
import { useDismissed } from "../../lib/useDismissed";

export type StravaSetupRowProps = {
  lapsed: boolean;
};

export function StravaSetupRow({ lapsed }: StravaSetupRowProps): React.ReactElement | null {
  const { dismissed, dismiss } = useDismissed();
  if (dismissed !== false) return null;

  return (
    <div className="sessions-setup">
      <span className="sessions-setup-text">
        <span className="sessions-setup-eyebrow">
          {lapsed ? "STRAVA · RECONNECT NEEDED" : "STRAVA · OPTIONAL"}
        </span>
        <span className="sessions-setup-title">
          {lapsed ? "Strava access has lapsed" : "Post sessions to your Strava feed"}
        </span>
        <span className="sessions-setup-body">
          {lapsed
            ? "Re-link it and your sessions can post to your feed again."
            : "One Rock Climbing activity per logged session. You approve it on strava.com and can revoke it any time."}
        </span>
      </span>
      <span className="sessions-setup-actions">
        <Link to="/app/setup" className="sessions-setup-connect">
          {lapsed ? "Re-link Strava" : "Connect Strava"}
        </Link>
        <button type="button" onClick={dismiss} className="sessions-setup-later">
          Not now
        </button>
      </span>
    </div>
  );
}
