import React from "react";
import { AreaDialog } from "../../areas/components/AreaDialog";
import { Field } from "../../areas/components/Field";
import { inputStyle } from "../../areas/styles";

export type NoteDialogProps = {
  title: string;
  submitLabel: string;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (note: string) => void;
};

export function NoteDialog({
  title,
  submitLabel,
  busy,
  error,
  onClose,
  onSubmit,
}: NoteDialogProps): React.ReactElement {
  const [note, setNote] = React.useState("");
  return (
    <AreaDialog
      label="Moderation"
      title={title}
      submitLabel={submitLabel}
      busy={busy}
      error={error}
      onClose={onClose}
      onSubmit={() => onSubmit(note.trim())}
    >
      <Field id="moderation-note" label="Note" optional>
        <textarea
          id="moderation-note"
          value={note}
          autoFocus
          maxLength={500}
          placeholder="Why, for the contributor"
          onChange={(e) => setNote(e.target.value)}
          className="area-textarea"
          style={inputStyle}
        />
      </Field>
    </AreaDialog>
  );
}
