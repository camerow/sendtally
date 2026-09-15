import React from "react";
import { t } from "@sendtally/features/i18n";
import { inputStyle } from "./styles";

export type ClimbNoteFieldProps = {
  note: string;
  name: string;
  onChange: (note: string) => void;
};

/**
 * A note is about the climb, not the session, so it only goes anywhere once the
 * climb has a name to roll up under. Unnamed, the field says so rather than
 * quietly dropping what was typed.
 */
export function ClimbNoteField({ note, name, onChange }: ClimbNoteFieldProps): React.ReactElement {
  const named = name.trim() !== "";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7, minWidth: 0 }}>
      <textarea
        value={note}
        rows={2}
        disabled={!named}
        placeholder={t("logSession.climbNotePlaceholder")}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...inputStyle,
          fontFamily: "var(--font-sans)",
          lineHeight: 1.5,
          resize: "vertical",
          opacity: named ? 1 : 0.5,
        }}
      />
      <span style={{ fontSize: 12, color: "rgba(64,63,76,0.55)" }}>
        {named ? t("logSession.noteKeptOn", { name: name.trim() }) : t("logSession.noteHint")}
      </span>
    </div>
  );
}
