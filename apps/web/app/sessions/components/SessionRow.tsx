import React from "react";
import { Link } from "react-router";
import type { SessionRow as SessionRowData } from "@sendtally/api-client";
import { t } from "@sendtally/features/i18n";
import { sessionDay, sessionTallyLabel } from "@sendtally/features/sessions";
import { useDisplayScales } from "@sendtally/features/settings";
import { Icon } from "../../components/Icon";
import { StravaMark } from "../../components/StravaMark";
import { DayColumn } from "./DayColumn";
import { RowTags } from "./RowTags";
import { rowClass } from "./rowClass";

export type SessionRowProps = {
  session: SessionRowData;
  title: string;
  /** Inside a group that already sets the row in from the page edge. */
  inset?: boolean;
  /** The hairline under the row, dropped on the last row of a group that has its own edge. */
  divider?: boolean;
  /** "Winter base · W4" when it ran one of a block's workouts. */
  blockTag?: string;
};

/** A climbing session in the log: its day, title, tally and tags; opens the session. */
export function SessionRow({
  session,
  title,
  inset = false,
  divider = true,
  blockTag,
}: SessionRowProps): React.ReactElement {
  const { weekday, day } = sessionDay(session);
  const meta = sessionTallyLabel(session, useDisplayScales());
  const onStrava = session.strava_activity_id !== null;
  const spoken = [
    title,
    `${weekday} ${day}`,
    meta,
    blockTag ?? null,
    onStrava ? t("sessions.postedToStrava") : null,
  ]
    .filter((part) => part !== null)
    .join(", ");
  return (
    <Link
      to={`/app/sessions/${encodeURIComponent(session.fingerprint)}`}
      aria-label={spoken}
      className={rowClass(inset, divider, true)}
    >
      <DayColumn weekday={weekday} day={day} />
      <span className="log-row-main">
        <span className="log-row-title">
          <span className="log-row-title-text">{title}</span>
          {onStrava && <StravaMark />}
        </span>
        <span className="log-row-meta">{meta}</span>
        {blockTag !== undefined && <span className="log-row-meta">{blockTag}</span>}
        <RowTags tags={session.tags} />
      </span>
      <span className="log-row-chevron">
        <Icon name="chevron" size={12} strokeWidth={2} />
      </span>
    </Link>
  );
}
