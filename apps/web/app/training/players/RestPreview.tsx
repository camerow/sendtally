import React from "react";
import { t } from "@sendtally/features/i18n";
import { elapsedClock } from "@sendtally/features/sessions";

/** A rest still to come between sets or exercises: a slim line, until it runs as a RestRow. None at zero. */
export function RestPreview({ seconds }: { seconds: number }): React.ReactElement | null {
  if (seconds <= 0) return null;
  return (
    <div className="rest-preview">
      <span>{t("activities.restPreview", { time: elapsedClock(seconds) })}</span>
    </div>
  );
}
