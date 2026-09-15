import React from "react";
import { Link } from "react-router";
import { useStoredDraft } from "@sendtally/features/log-session";
import { formatDate, t } from "@sendtally/features/i18n";
import { DiscardDraftDialog } from "../../components/DiscardDraftDialog";
import { sessionDraftStorage } from "../../lib/sessionDraftStorage";

export function DraftSessionRow(): React.ReactElement | null {
  const { stored, discard } = useStoredDraft(sessionDraftStorage);
  const [confirming, setConfirming] = React.useState(false);

  if (stored === null) return null;
  const { draft, savedAt } = stored;
  const climbs = t("common.climbCount", { count: draft.climbs.length });

  return (
    <>
      <div className="session-row session-row--draft">
        <span className="session-row-date">
          <span className="session-row-weekday">{formatDate(savedAt, { weekday: "short" })}</span>
          <span className="session-row-day">
            {formatDate(savedAt, { month: "short", day: "numeric" })}
          </span>
        </span>
        <span className="session-row-main">
          <span className="session-row-title">{t("sessions.unfinishedSession")}</span>
          <span className="session-row-meta" style={{ textTransform: "uppercase" }}>
            {climbs} · {draft.startTime}–{draft.endTime}
          </span>
        </span>
        <span className="session-row-draft-saved">
          {t("sessions.savedOnDeviceAt", {
            time: formatDate(savedAt, { hour: "2-digit", minute: "2-digit" }),
          })}
        </span>
        <span className="session-row-draft-actions">
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="session-row-draft-discard"
          >
            {t("common.discard")}
          </button>
          <Link to="/app/sessions/new?resume=1" className="session-row-draft-action">
            {t("sessions.resume")}
          </Link>
        </span>
      </div>
      {confirming && (
        <DiscardDraftDialog
          stored={stored}
          onCancel={() => setConfirming(false)}
          onDiscard={discard}
        />
      )}
    </>
  );
}
