import type { EntryKind, JournalEntry, SessionRow, SessionTag } from "@sendtally/api-client";

export type { EntryKind, JournalEntry };

export const ENTRY_KINDS = ["journal", "trip", "injury"] as const;

/** Only these span dates; the composer swaps a field group on the rest. */
export const SPANNING_KINDS: EntryKind[] = ["trip", "injury"];

export const ENTRY_BODY_MAX = 10000;

/**
 * One log holds sessions and entries. `at` is what the list sorts and groups on,
 * and `tags` is lifted to the top so the tag filter works over both without
 * knowing which it is looking at.
 */
export type LogItem = { key: string; at: string; tags: SessionTag[] } & (
  { type: "session"; session: SessionRow } | { type: "entry"; entry: JournalEntry }
);

/** What a composer holds while it is being filled in. Strings throughout: forms edit strings. */
export type EntryDraft = {
  kind: EntryKind;
  occurredAt: string;
  endsAt: string;
  title: string;
  body: string;
  fingerprint: string;
  tags: string[];
  /** Set only while writing an update on a thread. */
  parentId: string;
  severity: number | null;
};
