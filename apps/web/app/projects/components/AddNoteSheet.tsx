import React from "react";
import { t } from "@sendtally/features/i18n";
import { localDate } from "@sendtally/features/log-session";

export type AddNoteSheetProps = {
  onSave: (day: string, note: string) => Promise<void>;
  onClose: () => void;
};

export function AddNoteSheet({ onSave, onClose }: AddNoteSheetProps): React.ReactElement {
  const [day, setDay] = React.useState(() => localDate(new Date()));
  const [draft, setDraft] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const save = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      await onSave(day, draft.trim());
      onClose();
    } catch {
      setBusy(false);
      setError(t("climbs.noteSaveFailed"));
    }
  };

  return (
    <div className="note-sheet-backdrop" onClick={onClose}>
      <div
        className="note-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={t("climbs.addNote")}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="note-sheet-handle" />
        <span className="note-sheet-title">{t("climbs.addNote")}</span>
        <label className="note-sheet-field">
          <span className="note-sheet-label">{t("climbs.noteDate")}</span>
          <input
            type="date"
            value={day}
            max={localDate(new Date())}
            onChange={(e) => setDay(e.target.value)}
            className="note-sheet-input"
          />
        </label>
        <textarea
          value={draft}
          rows={5}
          autoFocus
          maxLength={2000}
          placeholder={t("climbs.notePlaceholder")}
          onChange={(e) => setDraft(e.target.value)}
          className="note-sheet-input"
        />
        {error !== null && <span className="note-sheet-error">{error}</span>}
        <button
          type="button"
          className="note-sheet-save"
          disabled={busy || day === "" || draft.trim() === ""}
          onClick={() => void save()}
        >
          {busy ? t("common.saving") : t("common.save")}
        </button>
      </div>
    </div>
  );
}
