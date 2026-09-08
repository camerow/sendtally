import React from "react";
import type { SendtallyApi, SessionTag } from "@sendtally/api-client";
import { useSessionTags } from "@sendtally/features/sessions";
import { TagPicker } from "../../components/TagPicker";

const heading: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 10,
  letterSpacing: "0.08em",
  color: "var(--text-label-accent)",
};

export function SessionTags({
  api,
  fingerprint,
  initial,
}: {
  api: SendtallyApi;
  fingerprint: string;
  initial: SessionTag[];
}): React.ReactElement {
  const { tags, suggestions, saving, error, add, remove } = useSessionTags(
    api,
    fingerprint,
    initial
  );

  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        background: "var(--surface-soft)",
        borderRadius: "var(--radius-card)",
        padding: "18px 20px",
        marginTop: 22,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={heading}>TAGS</span>
        {saving && <span style={{ ...heading, color: "rgba(64,63,76,0.45)" }}>SAVING…</span>}
        {error !== null && (
          <span style={{ ...heading, color: "var(--bs-watermelon-ink)" }}>{error}</span>
        )}
      </div>
      <TagPicker
        tags={tags}
        suggestions={suggestions}
        disabled={saving}
        onAdd={add}
        onRemove={remove}
      />
    </section>
  );
}
