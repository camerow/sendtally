import React from "react";
import { Link } from "react-router";
import { useStoredDraft } from "@sendtally/features/log-session";
import { DiscardDraftDialog } from "../../components/DiscardDraftDialog";
import { sessionDraftStorage } from "../../lib/sessionDraftStorage";

const label: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.08em",
  color: "rgba(64,63,76,0.6)",
};

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
        <span style={label}>
          SAVED ON THIS DEVICE AT{" "}
          {savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
        <span
          style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" }}
        >
          <button
            type="button"
            onClick={() => setConfirming(true)}
            style={{
              ...label,
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Discard
          </button>
          <Link to="/app/sessions/new" className="session-row-draft-action">
            Resume
          </Link>
        </span>
        <span />
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
