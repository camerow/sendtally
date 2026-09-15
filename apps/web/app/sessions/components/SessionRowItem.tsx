import React from "react";
import { Link } from "react-router";
import type { SessionRow } from "@sendtally/api-client";
import { t } from "@sendtally/features/i18n";
import { SessionRowBody, sessionRowAria } from "./SessionRowBody";

export function SessionRowItem({
  session,
  title,
}: {
  session: SessionRow;
  title: string;
}): React.ReactElement {
  return (
    <Link
      to={`/app/sessions/${encodeURIComponent(session.fingerprint)}`}
      className="session-row"
      aria-label={sessionRowAria(session, title, t("sessions.postedToStrava"))}
    >
      <SessionRowBody session={session} title={title} />
      <span className="session-row-chevron">›</span>
    </Link>
  );
}
