import React from "react";
import { t } from "@sendtally/features/i18n";
import { inputStyle } from "./styles";

export type ClimbNoteFieldProps = {
  id?: string;
  note: string;
  name: string;
  disabled?: boolean;
  onChange: (note: string) => void;
};

/**
 * A note is about the climb, not the session, so it only goes anywhere once the
 * climb has a name to roll up under; until then it shows disabled.
 */
export function ClimbNoteField({
  id,
  note,
  name,
  disabled = false,
  onChange,
}: ClimbNoteFieldProps): React.ReactElement {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7, minWidth: 0 }}>
      <textarea
        id={id}
        value={note}
        disabled={disabled}
        rows={2}
        placeholder={t("logSession.climbNotePlaceholder")}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...inputStyle,
          fontFamily: "var(--font-sans)",
          lineHeight: 1.5,
          resize: "vertical",
          ...(disabled ? { opacity: 0.45, cursor: "not-allowed", resize: "none" } : {}),
        }}
      />
      {!disabled && (
        <span style={{ fontSize: 12, color: "rgba(64,63,76,0.55)" }}>
          {t("logSession.noteKeptOn", { name: name.trim() })}
        </span>
      )}
    </div>
  );
}
