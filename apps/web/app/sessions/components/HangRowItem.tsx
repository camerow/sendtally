import React from "react";
import type { HangHistoryRow } from "@sendtally/api-client";
import { formatDate, t } from "@sendtally/features/i18n";
import {
  hangAt,
  hangEffortLabel,
  hangMetaLabel,
  hangTitle,
  sessionDay,
} from "@sendtally/features/sessions";
import { StravaMark } from "../../components/StravaMark";

/** A hangtally session in the log. It opens nowhere: hangtally is where it is edited. */
export function HangRowItem({ hang }: { hang: HangHistoryRow }): React.ReactElement {
  const at = hangAt(hang);
  const { weekday, day } = sessionDay({ start_at: at });
  const month = formatDate(new Date(at), { month: "short", timeZone: "UTC" });
  const title = hangTitle(hang);
  const meta = hangMetaLabel(hang);
  const effort = hangEffortLabel(hang);
  const onStrava = hang.stravaActivityId !== null;
  return (
    <div
      className="session-row"
      role="group"
      aria-label={[
        title,
        `${weekday} ${month} ${day}`,
        meta,
        effort,
        onStrava ? t("sessions.postedToStrava") : null,
      ]
        .filter((part) => part !== null)
        .join(", ")}
    >
      <span className="session-row-date">
        <span className="session-row-day">
          <span className="session-row-month">{month} </span>
          {day}
        </span>
        <span className="session-row-weekday">{weekday}</span>
      </span>
      <span className="session-row-main">
        <span className="session-row-title">
          {title}
          {onStrava && <StravaMark />}
        </span>
        <span className="session-row-meta">{meta}</span>
      </span>
      <span className="session-row-stats">
        {effort !== null && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
              color: "rgba(64,63,76,0.55)",
              letterSpacing: "0.04em",
            }}
          >
            {effort}
          </span>
        )}
      </span>
      <span className="session-row-badge" />
      <span />
    </div>
  );
}
