import React from "react";
import { Link } from "react-router";
import { useStoredDraft } from "@sendtally/features/log-session";
import { formatDate, t, upper } from "@sendtally/features/i18n";
import { DiscardDraftDialog } from "../../components/DiscardDraftDialog";
import { sessionDraftStorage } from "../../lib/sessionDraftStorage";

export function DraftSessionRow(): React.ReactElement | null {
  const { stored, discard } = useStoredDraft(sessionDraftStorage);
  const [confirming, setConfirming] = React.useState(false);

  if (stored === null) return null;
  const { draft, savedAt } = stored;
  const climbs = upper(t("web.sessions.draftClimbs", { count: draft.climbs.length }));

  return (
    <>
      <div className="session-row session-row--draft">
        <span className="session-row-date">
          <span className="session-row-weekday">
            {upper(formatDate(savedAt, { weekday: "short" }))}
          </span>
          <span className="session-row-day">
            {formatDate(savedAt, { month: "short", day: "numeric" })}
          </span>
        </span>
        <span className="session-row-main">
          <span className="session-row-title">{t("web.sessions.unfinishedSession")}</span>
          <span className="session-row-meta">
            {climbs} · {draft.startTime}–{draft.endTime}
          </span>
        </span>
        <span className="session-row-draft-saved">
          {upper(
            t("web.sessions.savedOnDeviceAt", {
              time: formatDate(savedAt, { hour: "2-digit", minute: "2-digit" }),
            })
          )}
        </span>
        <span className="session-row-draft-actions">
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="session-row-draft-discard"
          >
            {t("web.components.discard")}
          </button>
          <Link to="/app/sessions/new" className="session-row-draft-action">
            {t("web.sessions.resume")}
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
