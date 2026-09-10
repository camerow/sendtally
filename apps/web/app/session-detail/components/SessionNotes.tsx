import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { useSessionNotes } from "@sendtally/features/session-detail";
import { SESSION_NOTE_MAX } from "@sendtally/features/sessions";

const CLAMP_LINES = 4;

const heading: React.CSSProperties = {
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
  letterSpacing: "0.08em",
  color: "rgba(64,63,76,0.45)",
};

const button: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontWeight: 600,
  fontSize: 13,
  color: "rgba(64,63,76,0.72)",
  border: "1px solid rgba(64,63,76,0.25)",
  borderRadius: "var(--radius-control)",
  padding: "8px 14px",
  background: "none",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const card: React.CSSProperties = {
  background: "var(--bs-white)",
  border: "1px solid var(--line-on-light-soft)",
  borderRadius: "var(--radius-card)",
  padding: "22px 26px",
  marginTop: 22,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

export function SessionNotes({
  api,
  fingerprint,
  initial,
}: {
  api: SendtallyApi;
  fingerprint: string;
  initial: string | null;
}): React.ReactElement {
  const { notes, draft, setDraft, editing, start, cancel, save, saving, error } = useSessionNotes(
    api,
    fingerprint,
    initial
  );
  const [expanded, setExpanded] = React.useState(false);

  if (editing) {
    return (
      <section style={card}>
        <span style={heading}>NOTES</span>
        <textarea
          value={draft}
          autoFocus
          rows={6}
          maxLength={SESSION_NOTE_MAX}
          placeholder="How it felt, what to try next time."
          onChange={(e) => setDraft(e.target.value)}
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 15,
            lineHeight: 1.55,
            color: "var(--bs-gunmetal)",
            background: "var(--bs-white)",
            border: "1px solid rgba(64,63,76,0.15)",
            borderRadius: "var(--radius-control)",
            padding: "14px 16px",
            outline: "none",
            resize: "vertical",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <span style={error === null ? meta : { ...meta, color: "var(--bs-watermelon-ink)" }}>
            {error ?? `${draft.length} / ${SESSION_NOTE_MAX}`}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={cancel} disabled={saving} style={button}>
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              style={{
                ...button,
                background: "var(--bs-watermelon-ink)",
                borderColor: "transparent",
                color: "var(--bs-white)",
                opacity: saving ? 0.45 : 1,
              }}
            >
              {saving ? "Saving…" : "Save note"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (notes === null) {
    return (
      <section
        style={{
          background: "var(--surface-soft)",
          borderRadius: "var(--radius-card)",
          padding: "18px 22px",
          marginTop: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ ...heading, color: "rgba(64,63,76,0.55)" }}>NOTES</span>
          <span style={{ fontSize: 14, lineHeight: 1.55, color: "rgba(64,63,76,0.72)" }}>
            How it felt, what to try next time.
          </span>
        </div>
        <button type="button" onClick={start} style={{ ...button, padding: "10px 16px" }}>
          Add a note
        </button>
      </section>
    );
  }

  const clamp = !expanded && notes.length > 320;

  return (
    <section style={card}>
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}
      >
        <span style={heading}>NOTES</span>
        <button type="button" onClick={start} style={button}>
          Edit note
        </button>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 15,
          lineHeight: 1.55,
          color: "rgba(64,63,76,0.88)",
          whiteSpace: "pre-line",
          maxWidth: "68ch",
          ...(clamp
            ? {
                display: "-webkit-box",
                WebkitLineClamp: CLAMP_LINES,
                WebkitBoxOrient: "vertical" as const,
                overflow: "hidden",
              }
            : {}),
        }}
      >
        {notes}
      </p>
      {(clamp || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          style={{
            ...meta,
            alignSelf: "flex-start",
            color: "var(--text-link)",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          {expanded ? "SHOW LESS" : "SHOW MORE"}
        </button>
      )}
    </section>
  );
}
