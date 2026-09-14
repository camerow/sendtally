import type { EntryInput, JournalEntry, SessionRow } from "@sendtally/api-client";
import { formatDate, t, type MessageKey } from "../i18n";
import { SPANNING_KINDS, type EntryDraft, type EntryKind, type LogItem } from "./types";

const KIND_LABELS: Record<EntryKind, MessageKey> = {
  note: "journal.kindNote",
  reflection: "journal.kindReflection",
  trip: "journal.kindTrip",
  injury: "journal.kindInjury",
};

export function entryKindLabel(kind: EntryKind): string {
  return t(KIND_LABELS[kind]);
}

export function spansDates(kind: EntryKind): boolean {
  return SPANNING_KINDS.includes(kind);
}

/** An update belongs to its thread, never to the log. */
export function isThreadUpdate(entry: JournalEntry): boolean {
  return entry.parent_id !== null;
}

export function isoDay(at: string): string {
  return at.slice(0, 10);
}

export function today(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function logItems(sessions: SessionRow[], entries: JournalEntry[]): LogItem[] {
  const items: LogItem[] = [
    ...sessions.map((session): LogItem => ({
      key: `session:${session.fingerprint}`,
      at: session.start_at,
      tags: session.tags,
      type: "session",
      session,
    })),
    ...entries
      .filter((e) => !isThreadUpdate(e))
      .map((entry): LogItem => ({
        key: `entry:${entry.id}`,
        // A date-only entry sorts to the end of its day, above nothing it did not happen after.
        at: `${entry.occurred_at}T23:59:59.999Z`,
        tags: entry.tags,
        type: "entry",
        entry,
      })),
  ];
  return items.sort((a, b) => b.at.localeCompare(a.at));
}

/** Trips are date ranges, so the sessions inside one are matched, never attached. */
export function sessionsInSpan(sessions: SessionRow[], entry: JournalEntry): SessionRow[] {
  const from = entry.occurred_at;
  const to = entry.ends_at ?? entry.occurred_at;
  return sessions.filter((s) => {
    const day = isoDay(s.start_at);
    return day >= from && day <= to;
  });
}

export function entriesForSession(entries: JournalEntry[], fingerprint: string): JournalEntry[] {
  return entries.filter((e) => e.fingerprint === fingerprint && !isThreadUpdate(e));
}

export function openInjuries(entries: JournalEntry[]): JournalEntry[] {
  return entries.filter((e) => e.kind === "injury" && e.status === "ongoing");
}

export function emptyDraft(kind: EntryKind, occurredAt: string): EntryDraft {
  return {
    kind,
    occurredAt,
    endsAt: "",
    title: "",
    body: "",
    fingerprint: "",
    tags: [],
    parentId: "",
    severity: null,
  };
}

export function draftFromEntry(entry: JournalEntry): EntryDraft {
  return {
    kind: entry.kind,
    occurredAt: entry.occurred_at,
    endsAt: entry.ends_at ?? "",
    title: entry.title ?? "",
    body: entry.body,
    fingerprint: entry.fingerprint ?? "",
    tags: entry.tags.map((tag) => tag.name),
    parentId: entry.parent_id ?? "",
    severity: entry.severity,
  };
}

export function entryInput(draft: EntryDraft): EntryInput {
  const spanning = spansDates(draft.kind);
  return {
    kind: draft.kind,
    occurred_at: draft.occurredAt,
    ends_at: spanning && draft.endsAt !== "" ? draft.endsAt : null,
    title: draft.title.trim() === "" ? null : draft.title.trim(),
    body: draft.body,
    fingerprint: draft.fingerprint === "" ? null : draft.fingerprint,
    parent_id: draft.parentId === "" ? null : draft.parentId,
    severity: draft.severity,
    tags: draft.tags,
  };
}

/** Nothing to save is the one thing the composer refuses. */
export function draftIsEmpty(draft: EntryDraft): boolean {
  // An update carrying only a number still says something.
  if (draft.severity !== null) return false;
  return draft.title.trim() === "" && draft.body.trim() === "";
}

export function isUpdateDraft(draft: EntryDraft): boolean {
  return draft.parentId !== "";
}

export function entryTitle(entry: JournalEntry): string {
  const title = entry.title?.trim() ?? "";
  if (title !== "") return title;
  const firstLine = entry.body.trim().split("\n")[0] ?? "";
  return firstLine === "" ? entryKindLabel(entry.kind) : firstLine;
}

const day = (value: string): Date => new Date(`${value}T00:00:00Z`);

export function dayLabel(value: string): string {
  return formatDate(day(value), { day: "numeric", month: "short", timeZone: "UTC" });
}

/** "22 - 26 May", "From 18 May" while it is still going. */
export function spanLabel(from: string, to: string | null): string {
  if (to === null) return t("journal.spanOpen", { from: dayLabel(from) });
  return t("journal.spanClosed", { from: dayLabel(from), to: dayLabel(to) });
}

export function daysSince(from: string, now: Date = new Date()): number {
  const ms = Date.parse(`${today(now)}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Math.max(0, Math.round(ms / 86_400_000));
}

export type SeverityPoint = { at: string; severity: number };

/** The plottable part of a thread, oldest first. An update with no number is not a point. */
export function severitySeries(parent: JournalEntry, updates: JournalEntry[]): SeverityPoint[] {
  const points = [
    ...(parent.severity === null ? [] : [{ at: parent.occurred_at, severity: parent.severity }]),
    ...updates
      .filter((u): u is JournalEntry & { severity: number } => u.severity !== null)
      .map((u) => ({ at: u.occurred_at, severity: u.severity })),
  ];
  return points.sort((a, b) => a.at.localeCompare(b.at));
}
