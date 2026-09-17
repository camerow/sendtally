import React from "react";
import {
  enduranceLapValueLabel,
  isCleanLap,
  type Endurance,
} from "@sendtally/features/log-session";
import { t } from "@sendtally/features/i18n";

export type EnduranceLapsProps = { endurance: Endurance };

/** One bar per lap: full and fern when it went clean, cut short and watermelon when it did not. */
export function EnduranceLaps({ endurance }: EnduranceLapsProps): React.ReactElement {
  return (
    <span style={{ display: "flex", flexDirection: "column", gap: 7, paddingTop: 2 }}>
      {endurance.laps.map((lap, i) => {
        const clean = isCleanLap(endurance, i);
        return (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 14,
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "rgba(64,63,76,0.6)",
              }}
            >
              {i + 1}
            </span>
            <span
              role="img"
              aria-label={`${t("endurance.lapNumber", { n: i + 1 })}, ${enduranceLapValueLabel(endurance, i)}`}
              style={{
                flexGrow: 1,
                height: 12,
                borderRadius: 6,
                background: "var(--data-bar-empty)",
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  display: "block",
                  width: `${(Math.min(lap, endurance.target) / endurance.target) * 100}%`,
                  height: 12,
                  borderRadius: 6,
                  background: clean ? "var(--bs-fern)" : "var(--bs-watermelon-ink)",
                }}
              />
            </span>
            <span
              style={{
                width: 56,
                textAlign: "right",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--bs-gunmetal)",
              }}
            >
              {enduranceLapValueLabel(endurance, i)}
            </span>
          </span>
        );
      })}
    </span>
  );
}
