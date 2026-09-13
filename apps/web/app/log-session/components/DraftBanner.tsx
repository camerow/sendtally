import React from "react";
import type { StoredSessionDraft } from "@sendtally/features/log-session";
import { DiscardDraftDialog } from "../../components/DiscardDraftDialog";

function savedLabel(at: Date): string {
  return at.toLocaleString([], { weekday: "long", hour: "numeric", minute: "2-digit" });
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
            You have an unfinished session from {savedLabel(savedAt)}
          </span>
          <span className="draft-banner-meta">
            {draft.climbs.length} {draft.climbs.length === 1 ? "CLIMB" : "CLIMBS"} ·{" "}
            {draft.startTime}–{draft.endTime} · SAVED ON THIS DEVICE ONLY
          </span>
        </div>
        <div className="draft-banner-actions">
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="draft-banner-button draft-banner-button--ghost"
          >
            Start fresh
          </button>
          <button type="button" onClick={onResume} className="draft-banner-button">
            Pick up where I left off
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
