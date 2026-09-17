import type { EntryInput, JournalEntry, SessionRow } from "@sendtally/api-client";
import { formatDate, t, type MessageKey } from "../i18n";
import {
  SPANNING_KINDS,
  type EntryDraft,
  type EntryKind,
  type LogItem,
  type TripSpan,
} from "./types";

const KIND_LABELS: Record<EntryKind, MessageKey> = {
  journal: "journal.kindJournal",
  trip: "journal.kindTrip",
  injury: "journal.kindInjury",
};

export function entryKindLabel(kind: EntryKind): string {
  return t(KIND_LABELS[kind]);
}

const NEW_HEADINGS: Record<EntryKind, MessageKey> = {
  journal: "journal.newJournalEntry",
  trip: "journal.newTrip",
  injury: "journal.newInjury",
};

export function newEntryHeading(kind: EntryKind): string {
  return t(NEW_HEADINGS[kind]);
}

export function spansDates(kind: EntryKind): boolean {
  return SPANNING_KINDS.includes(kind);
}

/** An update belongs to its thread, never to the log. */
export function isThreadUpdate(entry: JournalEntry): boolean {
  return entry.parent_id !== null;
}

/** Only injuries have threads, so an update wears its injury's kind. */
export function displayKind(entry: JournalEntry): EntryKind {
  return isThreadUpdate(entry) ? "injury" : entry.kind;
}

export function isoDay(at: string): string {
  return at.slice(0, 10);
}

/** The date on the user's own calendar, which is the date they log sessions under. */
export function today(now: Date = new Date()): string {
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/** Which slice of the log is on show. "journal" is what the journal page is. */
export type LogScope = "all" | "sessions" | "journal" | "trips" | "injuries";

export const LOG_SCOPES: LogScope[] = ["all", "sessions", "journal", "trips", "injuries"];

const SCOPE_LABELS: Record<LogScope, MessageKey> = {
  all: "journal.showEverything",
  sessions: "journal.showSessions",
  journal: "journal.showJournal",
  trips: "journal.showTrips",
  injuries: "journal.showInjuries",
};

export function logScopeLabel(scope: LogScope): string {
  return t(SCOPE_LABELS[scope]);
}

export function logScopeItems(items: LogItem[], scope: LogScope): LogItem[] {
  if (scope === "all") return items;
  if (scope === "sessions") return items.filter((i) => i.type === "session");
  if (scope === "journal") return items.filter((i) => i.type === "entry");
  const kind: EntryKind = scope === "trips" ? "trip" : "injury";
  return items.filter((i) => i.type === "entry" && i.entry.kind === kind);
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
        inside: [],
      })),
  ];
  return items.sort((a, b) => b.at.localeCompare(a.at));
}

/** The last day a trip covers. A trip with no end is still going, so it runs to today. */
export function tripEnd(trip: TripSpan, now: Date = new Date()): string {
  const end = trip.ends_at ?? today(now);
  return end < trip.occurred_at ? trip.occurred_at : end;
}

export function inTrip(day: string, trip: TripSpan, now: Date = new Date()): boolean {
  return day >= trip.occurred_at && day <= tripEnd(trip, now);
}

export function logItemDay(item: LogItem): string {
  return item.type === "session" ? isoDay(item.session.start_at) : item.entry.occurred_at;
}

/**
 * A trip takes in everything logged inside its dates, matched on read so editing
 * the dates regroups. An injury belongs to the trip it started on.
 */
export function groupTrips(items: LogItem[], now: Date = new Date()): LogItem[] {
  const trips = items.filter((i) => i.type === "entry" && i.entry.kind === "trip");
  const owners = new Map<string, string>();
  for (const item of items) {
    if (trips.includes(item)) continue;
    const day = logItemDay(item);
    const owner = trips.find((trip) => trip.type === "entry" && inTrip(day, trip.entry, now));
    if (owner !== undefined) owners.set(item.key, owner.key);
  }
  return items
    .filter((item) => !owners.has(item.key))
    .map((item) =>
      trips.includes(item) && item.type === "entry"
        ? { ...item, inside: items.filter((i) => owners.get(i.key) === item.key) }
        : item
    );
}

/** Every item in a log, including the ones a trip holds. */
export function flatLog(items: LogItem[]): LogItem[] {
  return items.flatMap((item) => (item.type === "entry" ? [item, ...item.inside] : [item]));
}

/** A trip still going has no last day yet, so nothing can start after it. */
const lastDay = (span: TripSpan): string => span.ends_at ?? "9999-12-31";

/** Two trips never share a day, so every day of the log belongs to at most one. */
export function overlappingTrip(entries: JournalEntry[], span: TripSpan): JournalEntry | null {
  return (
    entries.find(
      (e) =>
        e.kind === "trip" &&
        e.id !== span.id &&
        e.occurred_at <= lastDay(span) &&
        lastDay(e) >= span.occurred_at
    ) ?? null
  );
}

export type TripDates = Pick<JournalEntry, "title" | "occurred_at" | "ends_at">;

export function tripOverlapMessage(trip: TripDates): string {
  return t("journal.tripOverlap", {
    title: trip.title?.trim() || entryKindLabel("trip"),
    dates: spanLabel(trip.occurred_at, trip.ends_at),
  });
}

/** Trips are date ranges, so the sessions inside one are matched, never attached. */
export function sessionsInSpan(sessions: SessionRow[], entry: JournalEntry): SessionRow[] {
  const from = entry.occurred_at;
  const to = entry.kind === "trip" ? tripEnd(entry) : (entry.ends_at ?? entry.occurred_at);
  return sessions.filter((s) => {
    const day = isoDay(s.start_at);
    return day >= from && day <= to;
  });
}

export function entriesForSession(entries: JournalEntry[], fingerprint: string): JournalEntry[] {
  return entries.filter((e) => e.fingerprints.includes(fingerprint) && !isThreadUpdate(e));
}

/** The sessions an entry names, in the order the log shows them. */
export function linkedSessions(sessions: SessionRow[], entry: JournalEntry): SessionRow[] {
  return sessions
    .filter((s) => entry.fingerprints.includes(s.fingerprint))
    .sort((a, b) => b.start_at.localeCompare(a.start_at));
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
    fingerprints: [],
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
    fingerprints: entry.fingerprints,
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
    fingerprints: draft.fingerprints,
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

export function entryHasTitle(entry: JournalEntry): boolean {
  return (entry.title?.trim() ?? "") !== "";
}

export function entryTitle(entry: JournalEntry): string {
  if (entryHasTitle(entry)) return entry.title!.trim();
  const firstLine = entry.body.trim().split("\n")[0] ?? "";
  return firstLine === "" ? entryKindLabel(entry.kind) : firstLine;
}

const day = (value: string): Date => new Date(`${value}T00:00:00Z`);

export function dayLabel(value: string): string {
  return formatDate(day(value), { day: "numeric", month: "short", timeZone: "UTC" });
}

export function longDayLabel(value: string): string {
  return formatDate(day(value), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "22 - 26 May" for a trip or injury, the full date for anything else. */
export function entryWhen(entry: JournalEntry): string {
  return spansDates(entry.kind)
    ? spanLabel(entry.occurred_at, entry.ends_at)
    : longDayLabel(entry.occurred_at);
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

/** Sessions climbed in the week up to each point - what tells a settling injury from a stopped one. */
export function sessionsNearPoints(sessions: SessionRow[], points: SeverityPoint[]): number[] {
  return points.map((point) => {
    const from = new Date(`${point.at}T00:00:00Z`);
    from.setUTCDate(from.getUTCDate() - 6);
    const start = from.toISOString().slice(0, 10);
    return sessions.filter((s) => {
      const day = isoDay(s.start_at);
      return day <= point.at && day >= start;
    }).length;
  });
}

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
