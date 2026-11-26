import React from "react";
import { t } from "@sendtally/features/i18n";
import { SET_COLUMNS } from "../components/setColumns";

/** Grade, Attempts and Sent over a climbing exercise's first rows, once a card. */
export function ClimbHeadings(): React.ReactElement {
  return (
    <div className={`${SET_COLUMNS.row} climb-headings`} aria-hidden="true">
      <span className={SET_COLUMNS.position} />
      <span className={SET_COLUMNS.lead}>
        <span className="train-label climb-grade">{t("common.grade")}</span>
        <span className="climb-edit-space" />
        <span className="train-label climb-attempts">{t("climbs.attempts")}</span>
      </span>
      <span className={`train-label ${SET_COLUMNS.tick}`}>{t("common.sent")}</span>
    </div>
  );
}
