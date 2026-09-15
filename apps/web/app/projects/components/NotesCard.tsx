import React from "react";
import type { ProjectNoteVM, ProjectSessionVM } from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";

export type NotesCardProps = {
  notes: ProjectNoteVM[];
  latestSession: ProjectSessionVM | undefined;
  onSave: (fingerprint: string, note: string) => Promise<void>;
};

const label: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  textTransform: "uppercase",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.08em",
  color: "var(--text-label-accent)",
};

const meta: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  textTransform: "uppercase",
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

// The notes are the beta: the newest one is what the climber knows now, and the
// ones under it are how they got there, each tied to the session it came from.
export function NotesCard({ notes, latestSession, onSave }: NotesCardProps): React.ReactElement {
  const [editing, setEditing] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const open = (fingerprint: string, note: string): void => {
    setEditing(fingerprint);
    setDraft(note);
    setError(null);
  };

  async function save(fingerprint: string): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await onSave(fingerprint, draft.trim());
      setBusy(false);
      setEditing(null);
    } catch {
      setBusy(false);
      setError(t("climbs.noteSaveFailed"));
    }
  }

  const [latest, ...older] = notes;
  const addTarget =
    latestSession !== undefined && latestSession.note === null ? latestSession : undefined;

  const editor = (fingerprint: string): React.ReactElement => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <textarea
        value={draft}
        rows={5}
        autoFocus
        placeholder={t("climbs.notePlaceholder")}
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
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {error !== null && (
          <span style={{ ...meta, textTransform: "none", color: "var(--text-label-accent)" }}>
            {error}
          </span>
        )}
        <div style={{ flex: 1 }} />
        <button
          type="button"
          style={{ ...linkButton, color: "rgba(64,63,76,0.55)" }}
          onClick={() => setEditing(null)}
        >
          {t("common.cancel")}
        </button>
        <button
          type="button"
          style={linkButton}
          disabled={busy}
          onClick={() => void save(fingerprint)}
        >
          {busy ? t("common.saving") : t("common.save")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="project-card">
      <span style={label}>{t("climbs.notes")}</span>

      {latest !== undefined &&
        (editing === latest.fingerprint ? (
          editor(latest.fingerprint)
        ) : (
          <button
            type="button"
            className="climb-note-latest"
            onClick={() => open(latest.fingerprint, latest.note)}
          >
            <span style={{ ...meta, color: "var(--text-on-light-secondary)" }}>
              {t("climbs.noteLatest", { date: latest.dateLabel })}
            </span>
            <span style={{ fontSize: 15, lineHeight: 1.6, whiteSpace: "pre-line" }}>
              {latest.note}
            </span>
          </button>
        ))}

      {addTarget !== undefined &&
        (editing === addTarget.fingerprint ? (
          editor(addTarget.fingerprint)
        ) : (
          <button
            type="button"
            className="climb-note-add"
            onClick={() => open(addTarget.fingerprint, "")}
          >
            {t("climbs.addNoteFor", { date: addTarget.dateLabel })}
          </button>
        ))}

      {notes.length === 0 && addTarget === undefined && (
        <span style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(64,63,76,0.45)" }}>
          {t("climbs.noNotes")}
        </span>
      )}

      {older.map((note) =>
        editing === note.fingerprint ? (
          <div key={note.fingerprint} className="climb-note-row">
            {editor(note.fingerprint)}
          </div>
        ) : (
          <button
            key={note.fingerprint}
            type="button"
            className="climb-note-row climb-note-row--button"
            onClick={() => open(note.fingerprint, note.note)}
          >
            <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  fontSize: 13,
                  textTransform: "uppercase",
                }}
              >
                {note.dateLabel}
              </span>
              <span style={{ ...meta, fontSize: 9 }}>
                {t("logSession.attemptCount", { count: note.attempts })}
              </span>
            </span>
            <span style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-line" }}>
              {note.note}
            </span>
          </button>
        )
      )}
    </div>
  );
}
