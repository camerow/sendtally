import React from "react";

export type BetaCardProps = {
  beta: string | null;
  updatedLabel: string | null;
  onSave: (beta: string) => Promise<void>;
};

const label: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.08em",
  color: "var(--text-label-accent)",
};

const meta: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 10,
  letterSpacing: "0.06em",
  color: "rgba(64,63,76,0.55)",
};

const linkButton: React.CSSProperties = {
  ...meta,
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
  color: "var(--bs-azure-ink)",
};

// Beta belongs to the climb, not to a session: it is the thing the user rewrites
// as they work out the moves, so editing happens where it is shown.
export function BetaCard({ beta, updatedLabel, onSave }: BetaCardProps): React.ReactElement {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(beta ?? "");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function save(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await onSave(draft.trim());
      setBusy(false);
      setEditing(false);
    } catch {
      setBusy(false);
      setError("Could not save the beta. Try again.");
    }
  }

  return (
    <div className="project-card">
      <span style={label}>BETA</span>
      {editing ? (
        <textarea
          value={draft}
          rows={6}
          autoFocus
          placeholder="The moves, the sequence, what went wrong last time"
          onChange={(e) => setDraft(e.target.value)}
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            lineHeight: 1.6,
            color: "var(--bs-gunmetal)",
            background: "var(--bs-white)",
            border: "1px solid rgba(64,63,76,0.15)",
            borderRadius: "var(--radius-control)",
            padding: "12px 14px",
            outline: "none",
            resize: "vertical",
          }}
        />
      ) : (
        <span
          style={{
            fontSize: 14,
            lineHeight: 1.6,
            whiteSpace: "pre-line",
            color: beta === null ? "rgba(64,63,76,0.45)" : "var(--bs-gunmetal)",
          }}
        >
          {beta ?? "No beta yet. Write down the sequence while it is fresh."}
        </span>
      )}
      {error !== null && (
        <span style={{ ...meta, color: "var(--text-label-accent)" }}>{error}</span>
      )}
      <div style={{ flex: 1 }} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderTop: "1px solid var(--line-on-light-soft)",
          paddingTop: 12,
        }}
      >
        <span style={meta}>{editing ? "" : (updatedLabel ?? "")}</span>
        <div style={{ flex: 1 }} />
        {editing ? (
          <>
            <button
              type="button"
              style={{ ...linkButton, color: "rgba(64,63,76,0.55)" }}
              onClick={() => {
                setDraft(beta ?? "");
                setEditing(false);
              }}
            >
              CANCEL
            </button>
            <button type="button" style={linkButton} disabled={busy} onClick={() => void save()}>
              {busy ? "SAVING…" : "SAVE"}
            </button>
          </>
        ) : (
          <button type="button" style={linkButton} onClick={() => setEditing(true)}>
            {beta === null ? "ADD BETA" : "EDIT"}
          </button>
        )}
      </div>
    </div>
  );
}
