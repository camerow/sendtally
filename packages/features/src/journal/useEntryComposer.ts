import React from "react";
import {
  ApiError,
  type EntryDetail,
  type JournalEntry,
  type SendtallyApi,
  type SessionRow,
} from "@sendtally/api-client";
import { t } from "../i18n";
import {
  draftIsEmpty,
  entryInput,
  overlappingTrip,
  tripOverlapMessage,
  type TripDates,
} from "./transforms";
import { tripContents, type TripContents } from "./trips";
import type { EntryDraft, TripSpan } from "./types";

/** The trip a 409 names, when the one in the way was not in the entries this client holds. */
function tripIn(body: unknown): TripDates | null {
  if (typeof body !== "object" || body === null || !("trip" in body)) return null;
  const trip: unknown = body.trip;
  if (typeof trip !== "object" || trip === null) return null;
  const { title, occurred_at, ends_at } = trip as Record<string, unknown>;
  if (typeof occurred_at !== "string") return null;
  return {
    title: typeof title === "string" ? title : null,
    occurred_at,
    ends_at: typeof ends_at === "string" ? ends_at : null,
  };
}

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
  // Only dates being set are checked: trips that overlapped before the rule existed stay editable.
  const datesChanged =
    editing === undefined ||
    draft.kind !== initial.kind ||
    draft.occurredAt !== initial.occurredAt ||
    draft.endsAt !== initial.endsAt;
  const overlap = React.useMemo(() => {
    const other = span === null || !datesChanged ? null : overlappingTrip(entries, span);
    return other === null ? null : tripOverlapMessage(other);
  }, [span, entries, datesChanged]);

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
      .catch((failure: unknown) => {
        const clash =
          failure instanceof ApiError && failure.status === 409 ? tripIn(failure.body) : null;
        setError(clash === null ? t("journal.saveFailed") : tripOverlapMessage(clash));
      })
      .finally(() => setSaving(false));
  }, [api, draft, editing, onSaved, overlap]);

  return { draft, setDraft, saving, error, trip, overlap, save };
}
