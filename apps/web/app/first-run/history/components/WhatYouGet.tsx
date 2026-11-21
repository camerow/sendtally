import React from "react";
import { t } from "@sendtally/features/i18n";
import { DarkCard } from "../../components/DarkCard";

const GAINS = [
  [
    "onboarding.history.how.everyClimb",
    "onboarding.history.how.everyClimbBody",
    [30, 50, 40, 70, 60, 90],
  ],
  ["onboarding.history.how.pyramid", "onboarding.history.how.pyramidBody", [100, 70, 45, 20]],
  ["onboarding.history.how.hardest", "onboarding.history.how.hardestBody", [30, 45, 55, 75, 100]],
  ["onboarding.history.how.effort", "onboarding.history.how.effortBody", [40, 60, 50, 80, 70]],
] as const;

/** H2i's card: what an import brings, each with a small gold chart of it. */
export function WhatYouGet(): React.ReactElement {
  return (
    <DarkCard label={t("onboarding.history.how.whatYouGet")}>
      {GAINS.map(([title, body, bars]) => (
        <div key={title} className="gain">
          <span className="gain-bars" aria-hidden="true">
            {bars.map((h, i) => (
              <i key={i} style={{ height: `${h}%` }} />
            ))}
          </span>
          <span className="gain-text">
            <span className="gain-title">{t(title)}</span>
            <span className="gain-body">{t(body)}</span>
          </span>
        </div>
      ))}
    </DarkCard>
  );
}
