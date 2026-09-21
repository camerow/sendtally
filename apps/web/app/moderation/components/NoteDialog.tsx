import React from "react";
import { AreaDialog } from "../../areas/components/AreaDialog";
import { Field } from "../../areas/components/Field";
import { inputStyle } from "../../areas/styles";

export type NoteDialogProps = {
  title: string;
  submitLabel: string;
  busy: boolean;
  error: string | null;
  /** One-click notes for the usual reasons. */
  reasons?: readonly string[];
  hint?: string | undefined;
  onClose: () => void;
  onSubmit: (note: string) => void;
};

export function NoteDialog({
  title,
  submitLabel,
  busy,
  error,
  reasons = [],
  hint,
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
      {hint !== undefined && <p className="mod-muted">{hint}</p>}
      {reasons.length > 0 && (
        <div className="mod-reasons">
          {reasons.map((reason) => (
            <button key={reason} type="button" className="mod-pill" onClick={() => setNote(reason)}>
              {reason}
            </button>
          ))}
        </div>
      )}
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
