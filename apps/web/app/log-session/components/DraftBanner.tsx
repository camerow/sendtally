import React from "react";
import type { StoredSessionDraft } from "@sendtally/features/log-session";
import { columnHead } from "./styles";

const buttonBase: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontWeight: 600,
  fontSize: 13,
  padding: "10px 16px",
  borderRadius: "var(--radius-control)",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const ghost: React.CSSProperties = {
  ...buttonBase,
  background: "none",
  border: "1px solid rgba(64,63,76,0.32)",
  color: "rgba(64,63,76,0.8)",
};

const filled = (background: string): React.CSSProperties => ({
  ...buttonBase,
  background,
  border: "none",
  color: "var(--bs-white)",
});

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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: "var(--bs-gold)",
        borderRadius: "var(--radius-card)",
        padding: "16px 20px",
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={{ fontWeight: 600, fontSize: 15, color: "var(--bs-gunmetal)" }}>
          {confirming
            ? "Throw away the unfinished session?"
            : `You have an unfinished session from ${savedLabel(savedAt)}`}
        </span>
        <span style={{ ...columnHead, color: "rgba(64,63,76,0.7)" }}>
          {draft.climbs.length} {draft.climbs.length === 1 ? "CLIMB" : "CLIMBS"} · {draft.startTime}
          –{draft.endTime} · SAVED ON THIS DEVICE ONLY
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
        {confirming ? (
          <>
            <button type="button" onClick={() => setConfirming(false)} style={ghost}>
              Keep it
            </button>
            <button type="button" onClick={onStartFresh} style={filled("var(--bs-watermelon-ink)")}>
              Discard
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setConfirming(true)} style={ghost}>
              Start fresh
            </button>
            <button type="button" onClick={onResume} style={filled("var(--bs-gunmetal)")}>
              Pick up where I left off
            </button>
          </>
        )}
      </div>
    </div>
  );
}
