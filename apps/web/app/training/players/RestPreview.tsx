import React from "react";
import { t } from "@sendtally/features/i18n";
import { elapsedClock } from "@sendtally/features/sessions";

/** A rest still to come between sets or exercises: a slim line, until it runs as a RestRow. */
export function RestPreview({ seconds }: { seconds: number }): React.ReactElement {
  return (
    <div className="rest-preview">
      <span>{t("activities.restPreview", { time: elapsedClock(seconds) })}</span>
    </div>
  );
}
