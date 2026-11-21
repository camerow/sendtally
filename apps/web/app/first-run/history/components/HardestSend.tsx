import React from "react";
import { t } from "@sendtally/features/i18n";

export type HardestSendProps = { gradeLabel: string; name: string; year: number | null };

/** The hardest send on the dark card: its grade in gold, its name, and the year it went. */
export function HardestSend({ gradeLabel, name, year }: HardestSendProps): React.ReactElement {
  return (
    <div className="hardest-send">
      <span className="hardest-send-grade">{gradeLabel}</span>
      <span className="hardest-send-text">
        <span className="hardest-send-name">{name}</span>
        {year !== null && (
          <span className="dark-meta">
            {t("onboarding.history.card.hardestSendYear", { year })}
          </span>
        )}
      </span>
    </div>
  );
}
