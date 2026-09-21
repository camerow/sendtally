import React from "react";
import type { SessionRow } from "@sendtally/api-client";
import { sessionDay, sessionGradeLabels, sessionMetaLabel } from "@sendtally/features/sessions";
import { formatDate } from "@sendtally/features/i18n";
import { StravaMark } from "../../components/StravaMark";

/**
 * A session row's four cells. The trailing cell is the caller's: a chevron in
 * the log, a remove control in the composer. Shared so a session looks the same
 * wherever it is listed.
 */
export function SessionRowBody({
  session,
  title,
}: {
  session: SessionRow;
  title: string;
}): React.ReactElement {
  const { weekday, day } = sessionDay(session);
  const month = formatDate(new Date(session.start_at), { month: "short", timeZone: "UTC" });
  const onStrava = session.strava_activity_id !== null;
  return (
    <>
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
        <span className="session-row-meta">{sessionMetaLabel(session)}</span>
        {session.tags.length > 0 && (
          <span className="session-row-tags">
            {session.tags.map((tag) => (
              <span key={tag.id} className="session-row-tag">
                {tag.name}
              </span>
            ))}
          </span>
        )}
      </span>
      <span className="session-row-stats">
        {sessionGradeLabels(session).map((g) => (
          <span
            key={g.kind}
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: g.kind === "sent" ? 600 : 500,
              color: g.kind === "sent" ? "var(--text-label-accent)" : "rgba(64,63,76,0.55)",
              letterSpacing: "0.04em",
            }}
          >
            {g.label}
          </span>
        ))}
      </span>
      <span className="session-row-badge" />
    </>
  );
}

export function sessionRowAria(session: SessionRow, title: string, postedLabel: string): string {
  const { weekday, day } = sessionDay(session);
  const month = formatDate(new Date(session.start_at), { month: "short", timeZone: "UTC" });
  return [
    title,
    `${weekday} ${month} ${day}`,
    sessionMetaLabel(session),
    session.strava_activity_id === null ? null : postedLabel,
  ]
    .filter((part) => part !== null)
    .join(", ");
}
