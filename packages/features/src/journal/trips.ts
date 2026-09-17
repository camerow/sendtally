import type { JournalEntry, SessionRow } from "@sendtally/api-client";
import { formatNumber, t } from "../i18n";
import { durationLabel, sessionMinutes } from "../sessions/years";
import { inTrip, isoDay, tripEnd } from "./transforms";
import type { TripSpan } from "./types";

export type TripDay = {
  day: string;
  n: number;
  sessions: SessionRow[];
  entries: JournalEntry[];
  updates: JournalEntry[];
};

export type TripStat = { label: string; value: string };

export type TripContents = { sessions: SessionRow[]; entries: JournalEntry[] };

const nextDay = (day: string): string => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

const isTripOwnEntry = (entry: JournalEntry, span: TripSpan): boolean =>
  entry.kind === "trip" || entry.id === span.id;

/** What a trip holds: the sessions and top-level entries dated inside it. */
export function tripContents(
  span: TripSpan,
  sessions: SessionRow[],
  entries: JournalEntry[],
  now: Date = new Date()
): TripContents {
  return {
    sessions: sessions
      .filter((s) => inTrip(isoDay(s.start_at), span, now))
      .sort((a, b) => a.start_at.localeCompare(b.start_at)),
    entries: entries
      .filter(
        (e) => e.parent_id === null && !isTripOwnEntry(e, span) && inTrip(e.occurred_at, span, now)
      )
      .sort((a, b) => a.occurred_at.localeCompare(b.occurred_at)),
  };
}

/** Every day of a trip, oldest first, with injury updates alongside what they happened next to. */
export function tripDays(
  trip: TripSpan,
  sessions: SessionRow[],
  entries: JournalEntry[],
  now: Date = new Date()
): TripDay[] {
  const inside = tripContents(trip, sessions, entries, now);
  const updates = entries.filter((e) => e.parent_id !== null && inTrip(e.occurred_at, trip, now));
  const end = tripEnd(trip, now);
  const days: TripDay[] = [];
  for (let day = trip.occurred_at, n = 1; day <= end; day = nextDay(day), n++) {
    days.push({
      day,
      n,
      sessions: inside.sessions.filter((s) => isoDay(s.start_at) === day),
      entries: inside.entries.filter((e) => e.occurred_at === day),
      updates: updates.filter((u) => u.occurred_at === day),
    });
  }
  return days;
}

/** Injuries that started before the trip and were still going when it began. */
export function injuriesCarriedIn(trip: TripSpan, entries: JournalEntry[]): JournalEntry[] {
  return entries.filter(
    (e) =>
      e.kind === "injury" &&
      e.parent_id === null &&
      e.occurred_at < trip.occurred_at &&
      (e.ends_at === null || e.ends_at >= trip.occurred_at)
  );
}

/** The hardest RPE of each day, null on a day with no session. */
export function tripEffort(days: TripDay[]): Array<number | null> {
  return days.map((d) =>
    d.sessions.length === 0 ? null : Math.max(...d.sessions.map((s) => s.rpe))
  );
}

/** Past this many days a bar per day has no room for its own labels. */
const LABELLED_DAYS = 10;

/** Whether each bar carries its RPE and day number, or only the first and last day are named. */
export function effortLabelled(days: number): boolean {
  return days <= LABELLED_DAYS;
}

/** The day number under a bar, blank between the ends of a long trip. */
export function effortDayLabel(index: number, days: number): string {
  return effortLabelled(days) || index === 0 || index === days - 1 ? formatNumber(index + 1) : "";
}

export function tripStats(days: TripDay[]): TripStat[] {
  const sessions = days.flatMap((d) => d.sessions);
  const climbed = days.filter((d) => d.sessions.length > 0).length;
  const minutes = sessions.reduce((sum, s) => sum + sessionMinutes(s), 0);
  const climbs = sessions.reduce((sum, s) => sum + s.climb_count, 0);
  const top = sessions.reduce<SessionRow | null>(
    (best, s) => (s.top_send_grade > (best?.top_send_grade ?? -1) ? s : best),
    null
  );
  const rpe =
    sessions.length === 0 ? null : sessions.reduce((sum, s) => sum + s.rpe, 0) / sessions.length;
  return [
    {
      label: t("journal.tripDaysClimbed"),
      value: `${formatNumber(climbed)}/${formatNumber(days.length)}`,
    },
    { label: t("common.sessions"), value: formatNumber(sessions.length) },
    { label: t("sessionDetail.statTime"), value: durationLabel(minutes) },
    { label: t("common.climbs"), value: formatNumber(climbs) },
    {
      label: t("trends.hardestSend"),
      value: top === null ? "-" : (top.top_send_grade_label ?? `V${top.top_send_grade}`),
    },
    {
      label: t("journal.tripAverageRpe"),
      value:
        rpe === null
          ? "-"
          : formatNumber(rpe, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    },
  ];
}
