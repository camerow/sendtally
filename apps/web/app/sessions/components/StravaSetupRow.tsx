import React from "react";
import { Link } from "react-router";
import { t } from "@sendtally/features/i18n";
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
          {lapsed ? t("sessions.setupEyebrowLapsed") : t("sessions.setupEyebrow")}
        </span>
        <span className="sessions-setup-title">
          {lapsed ? t("sessions.setupLapsedTitle") : t("sessions.setupTitle")}
        </span>
        <span className="sessions-setup-body">
          {lapsed ? t("sessions.setupLapsedBody") : t("sessions.setupBody")}
        </span>
      </span>
      <span className="sessions-setup-actions">
        <Link to="/app/setup" className="sessions-setup-connect">
          {lapsed ? t("settings.relinkStrava") : t("sessions.connectStrava")}
        </Link>
        <button type="button" onClick={dismiss} className="sessions-setup-later">
          {t("sessions.notNow")}
        </button>
      </span>
    </div>
  );
}
