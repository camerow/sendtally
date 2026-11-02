import React from "react";
import type { Activity } from "@sendtally/api-client";
import { activityAt, activityEffortLabel, activityMetaLabel } from "@sendtally/features/activities";
import { formatDate } from "@sendtally/features/i18n";
import { sessionDay } from "@sendtally/features/sessions";

/** Other training in the log. It opens nowhere: the app is where it is logged and edited. */
export function ActivityRowItem({ activity }: { activity: Activity }): React.ReactElement {
  const at = activityAt(activity);
  const { weekday, day } = sessionDay({ start_at: at });
  const month = formatDate(new Date(at), { month: "short", timeZone: "UTC" });
  const meta = activityMetaLabel(activity);
  const effort = activityEffortLabel(activity);
  return (
    <div
      className="session-row"
      role="group"
      aria-label={[activity.title, `${weekday} ${month} ${day}`, meta, effort]
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
        <span className="session-row-title">{activity.title}</span>
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
