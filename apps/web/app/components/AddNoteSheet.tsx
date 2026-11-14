import React from "react";
import { t } from "@sendtally/features/i18n";
import { localDate } from "@sendtally/features/log-session";
import { Sheet } from "./Sheet";

export type AddNoteSheetProps = {
  /** The note to edit, "new" to write one, or null when closed. A session's note keeps its session's day. */
  note: { id: string; day: string; note: string; source?: "session" | "page" } | "new" | null;
  /** The day a new note starts on; today when not given. */
  day?: string;
  /** Saved locally first, so the sheet closes at once. */
  onSave: (day: string, note: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

/** Writes, rewrites or deletes one dated note; deleting asks first. */
export function AddNoteSheet({
  note,
  day: startDay,
  onSave,
  onDelete,
  onClose,
}: AddNoteSheetProps): React.ReactElement {
  const editing = note !== "new" && note !== null ? note : null;
  const [day, setDay] = React.useState(() => localDate(new Date()));
  const [draft, setDraft] = React.useState("");
  const [confirming, setConfirming] = React.useState(false);

  const [wasOpen, setWasOpen] = React.useState<AddNoteSheetProps["note"]>(null);
  if (note !== wasOpen) {
    setWasOpen(note);
    setDay(editing?.day ?? startDay ?? localDate(new Date()));
    setDraft(editing?.note ?? "");
    setConfirming(false);
  }

  if (confirming && editing !== null) {
    return (
      <Sheet
        open
        title={t("climbs.deleteNote")}
        onClose={() => setConfirming(false)}
        action={{
          label: t("common.delete"),
          danger: true,
          onPress: () => {
            onDelete(editing.id);
            onClose();
          },
        }}
      />
    );
  }

  return (
    <Sheet
      open={note !== null}
      title={editing === null ? t("climbs.addNote") : t("climbs.editNote")}
      onClose={onClose}
      action={{
        label: t("common.save"),
        disabled: draft.trim() === "" || day === "",
        onPress: () => {
          onSave(day, draft.trim());
          onClose();
        },
      }}
    >
      <label className="field">
        <span className="field-label">{t("climbs.noteDate")}</span>
        <input
          type="date"
          className="field-input"
          value={day}
          max={localDate(new Date())}
          disabled={editing?.source === "session"}
          onChange={(e) => setDay(e.target.value)}
        />
      </label>
      <textarea
        className="field-input field-input--area"
        value={draft}
        rows={5}
        maxLength={2000}
        data-autofocus
        aria-label={t("common.notes")}
        placeholder={t("climbs.notePlaceholder")}
        onChange={(e) => setDraft(e.target.value)}
      />
      {editing !== null && (
        <button type="button" className="danger-outline" onClick={() => setConfirming(true)}>
          {t("climbs.deleteNote")}
        </button>
      )}
    </Sheet>
  );
}
