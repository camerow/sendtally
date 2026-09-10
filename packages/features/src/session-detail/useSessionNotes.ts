import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";

export type SessionNotesEditor = {
  notes: string | null;
  draft: string;
  setDraft: (draft: string) => void;
  editing: boolean;
  start: () => void;
  cancel: () => void;
  save: () => void;
  saving: boolean;
  error: string | null;
};

export function useSessionNotes(
  api: SendtallyApi,
  fingerprint: string,
  initial: string | null
): SessionNotesEditor {
  const [notes, setNotes] = React.useState(initial);
  const [draft, setDraft] = React.useState(initial ?? "");
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const start = React.useCallback((): void => {
    setDraft(notes ?? "");
    setError(null);
    setEditing(true);
  }, [notes]);

  const cancel = React.useCallback((): void => {
    setEditing(false);
    setError(null);
  }, []);

  const save = React.useCallback((): void => {
    setSaving(true);
    setError(null);
    api
      .setSessionNotes(fingerprint, draft)
      .then(({ notes: saved }) => {
        setNotes(saved);
        setEditing(false);
      })
      .catch(() => setError("Could not save this note. Try again."))
      .finally(() => setSaving(false));
  }, [api, draft, fingerprint]);

  return { notes, draft, setDraft, editing, start, cancel, save, saving, error };
}
