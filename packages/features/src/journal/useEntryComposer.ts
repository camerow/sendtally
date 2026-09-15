import React from "react";
import type { EntryDetail, SendtallyApi } from "@sendtally/api-client";
import { t } from "../i18n";
import { draftIsEmpty, entryInput } from "./transforms";
import type { EntryDraft } from "./types";

export type EntryComposer = {
  draft: EntryDraft;
  setDraft: React.Dispatch<React.SetStateAction<EntryDraft>>;
  saving: boolean;
  error: string | null;
  save: () => void;
};

/**
 * One composer for every kind, and for both new and existing entries: `editing`
 * is the only thing that changes which request is sent.
 */
export function useEntryComposer(
  api: SendtallyApi,
  initial: EntryDraft,
  options: { editing?: string; onSaved: (entry: EntryDetail) => void }
): EntryComposer {
  const [draft, setDraft] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { editing, onSaved } = options;

  const save = React.useCallback((): void => {
    if (draftIsEmpty(draft)) {
      setError(t("journal.needsSomething"));
      return;
    }
    setSaving(true);
    setError(null);
    const input = entryInput(draft);
    const pending =
      editing === undefined ? api.createEntry(input) : api.updateEntry(editing, input);
    pending
      .then(({ entry }) => onSaved(entry))
      .catch(() => setError(t("journal.saveFailed")))
      .finally(() => setSaving(false));
  }, [api, draft, editing, onSaved]);

  return { draft, setDraft, saving, error, save };
}
