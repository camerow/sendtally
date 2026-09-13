import React from "react";
import { Link } from "react-router";
import { useStoredDraft } from "@sendtally/features/log-session";
import { DiscardDraftDialog } from "../../components/DiscardDraftDialog";
import { sessionDraftStorage } from "../../lib/sessionDraftStorage";

export function DraftSessionRow(): React.ReactElement | null {
  const { stored, discard } = useStoredDraft(sessionDraftStorage);
  const [confirming, setConfirming] = React.useState(false);

  if (stored === null) return null;
  const { draft, savedAt } = stored;
  const climbs = `${draft.climbs.length} ${draft.climbs.length === 1 ? "CLIMB" : "CLIMBS"}`;

  return (
    <>
      <div className="session-row session-row--draft">
        <span className="session-row-date">
          <span className="session-row-weekday">
            {savedAt.toLocaleDateString([], { weekday: "short" }).toUpperCase()}
          </span>
          <span className="session-row-day">
            {savedAt.toLocaleDateString([], { month: "short", day: "numeric" })}
          </span>
        </span>
        <span className="session-row-main">
          <span className="session-row-title">Unfinished session</span>
          <span className="session-row-meta">
            {climbs} · {draft.startTime}–{draft.endTime}
          </span>
        </span>
        <span className="session-row-draft-saved">
          SAVED ON THIS DEVICE AT{" "}
          {savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
        <span className="session-row-draft-actions">
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="session-row-draft-discard"
          >
            Discard
          </button>
          <Link to="/app/sessions/new" className="session-row-draft-action">
            Resume
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
