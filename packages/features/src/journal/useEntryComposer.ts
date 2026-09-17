import React from "react";
import type { EntryDetail, JournalEntry, SendtallyApi, SessionRow } from "@sendtally/api-client";
import { t } from "../i18n";
import { draftIsEmpty, entryInput, entryTitle, overlappingTrip, spanLabel } from "./transforms";
import { tripContents, type TripContents } from "./trips";
import type { EntryDraft, TripSpan } from "./types";

export type EntryComposer = {
  draft: EntryDraft;
  setDraft: React.Dispatch<React.SetStateAction<EntryDraft>>;
  saving: boolean;
  error: string | null;
  /** What a trip draft's dates take in, null for every other kind. */
  trip: TripContents | null;
  /** Why a trip draft cannot be saved: another trip already holds one of its days. */
  overlap: string | null;
  save: () => void;
};

/**
 * One composer for every kind, and for both new and existing entries: `editing`
 * is the only thing that changes which request is sent.
 */
export function useEntryComposer(
  api: SendtallyApi,
  initial: EntryDraft,
  options: {
    editing?: string;
    sessions: SessionRow[];
    entries: JournalEntry[];
    onSaved: (entry: EntryDetail) => void;
  }
): EntryComposer {
  const [draft, setDraft] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { editing, sessions, entries, onSaved } = options;

  const span = React.useMemo(
    (): TripSpan | null =>
      draft.kind === "trip" && draft.occurredAt !== ""
        ? {
            id: editing ?? null,
            occurred_at: draft.occurredAt,
            ends_at: draft.endsAt === "" ? null : draft.endsAt,
          }
        : null,
    [draft.kind, draft.occurredAt, draft.endsAt, editing]
  );
  const trip = React.useMemo(
    () => (span === null ? null : tripContents(span, sessions, entries)),
    [span, sessions, entries]
  );
  const overlap = React.useMemo(() => {
    const other = span === null ? null : overlappingTrip(entries, span);
    return other === null
      ? null
      : t("journal.tripOverlap", {
          title: entryTitle(other),
          dates: spanLabel(other.occurred_at, other.ends_at),
        });
  }, [span, entries]);

  const save = React.useCallback((): void => {
    if (overlap !== null) return;
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
  }, [api, draft, editing, onSaved, overlap]);

  return { draft, setDraft, saving, error, trip, overlap, save };
}
