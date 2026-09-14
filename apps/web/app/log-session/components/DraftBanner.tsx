import React from "react";
import type { StoredSessionDraft } from "@sendtally/features/log-session";
import { formatDate, t, upper } from "@sendtally/features/i18n";
import { DiscardDraftDialog } from "../../components/DiscardDraftDialog";

function savedLabel(at: Date): string {
  return formatDate(at, { weekday: "long", hour: "numeric", minute: "2-digit" });
}

export function DraftBanner({
  stored,
  onResume,
  onStartFresh,
}: {
  stored: StoredSessionDraft;
  onResume: () => void;
  onStartFresh: () => void;
}): React.ReactElement {
  const [confirming, setConfirming] = React.useState(false);
  const { draft, savedAt } = stored;

  return (
    <>
      <div className="draft-banner">
        <div className="draft-banner-text">
          <span className="draft-banner-title">
            {t("web.logSession.unfinishedFrom", { when: savedLabel(savedAt) })}
          </span>
          <span className="draft-banner-meta">
            {upper(
              t("web.logSession.draftMeta", {
                count: draft.climbs.length,
                start: draft.startTime,
                end: draft.endTime,
              })
            )}
          </span>
        </div>
        <div className="draft-banner-actions">
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="draft-banner-button draft-banner-button--ghost"
          >
            {t("web.logSession.startFresh")}
          </button>
          <button type="button" onClick={onResume} className="draft-banner-button">
            {t("web.logSession.pickUp")}
          </button>
        </div>
      </div>
      {confirming && (
        <DiscardDraftDialog
          stored={stored}
          onCancel={() => setConfirming(false)}
          onDiscard={onStartFresh}
        />
      )}
    </>
  );
}
