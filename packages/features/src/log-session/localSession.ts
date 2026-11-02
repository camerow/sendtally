import {
  buildManualSession,
  normalizeTagName,
  parseClimbs,
  type ManualSessionForm,
  type Session,
} from "@sendtally/core";
import type {
  LogSessionInput,
  SessionDetail,
  SessionRow,
  SessionTag,
  SessionWithClimbs,
} from "@sendtally/api-client";

/** The server scores against this many of the user's latest sessions, and so does the phone. */
const HISTORY_LIMIT = 200;

export function formOf(input: LogSessionInput): ManualSessionForm {
  return {
    ...input,
    climbs: input.climbs.map((c) => ({
      ...c,
      name: c.name ?? "",
      kind: c.kind ?? "send",
      tries: c.tries ?? 1,
    })),
  };
}

function historyOf(rows: readonly SessionWithClimbs[], except: string): Session[] {
  return [...rows]
    .sort((a, b) => b.start_at.localeCompare(a.start_at))
    .slice(0, HISTORY_LIMIT)
    .filter((r) => r.fingerprint !== except && r.rpe_source !== "none")
    .map((r) => ({
      start: new Date(r.start_at),
      end: new Date(r.end_at),
      climbs: r.climbs.map((c) => ({
        time: new Date(c.time),
        vGrade: c.vGrade,
        name: c.name,
        kind: c.kind,
        tries: c.tries,
        ...(c.endurance === undefined ? {} : { endurance: c.endurance }),
      })),
    }));
}

function tagsOf(names: readonly string[], known: readonly SessionTag[]): SessionTag[] {
  const bySlug = new Map(known.map((t) => [t.slug, t]));
  return names.flatMap((raw) => {
    const tag = normalizeTagName(raw);
    if (tag === null) return [];
    return [bySlug.get(tag.slug) ?? { id: `local-${tag.slug}`, ...tag }];
  });
}

/**
 * The session as the server will store it, scored on the phone against the cached history, so
 * one logged offline shows its effort, title and summary at once. The server's own answer
 * replaces it once the log reaches it. An edit keeps what the form does not carry: the Strava
 * post, the journal, the crag and climb links.
 */
export function localSession(
  fingerprint: string,
  input: LogSessionInput,
  history: readonly SessionWithClimbs[],
  knownTags: readonly SessionTag[],
  previous?: SessionDetail
): SessionDetail {
  const {
    climbs_json,
    summary: _summary,
    ...row
  } = buildManualSession(fingerprint, formOf(input), historyOf(history, fingerprint));
  const links = new Map(previous?.climbs.map((c) => [c.name.trim(), c.link]));
  return {
    source: "manual",
    board: null,
    strava_activity_id: null,
    posted_at: null,
    post_state: null,
    post_error: null,
    membership_id: null,
    week: null,
    focus: null,
    ...previous,
    ...row,
    notes: input.notes?.trim() || null,
    tags: tagsOf(input.tags ?? [], [...(previous?.tags ?? []), ...knownTags]),
    entries: previous?.entries ?? [],
    area: previous?.area?.id === input.areaId ? (previous?.area ?? null) : null,
    climbs: parseClimbs(climbs_json).map((climb, i) => ({
      ...climb,
      note: input.climbs[i]?.note?.trim() || null,
      link: links.get(climb.name.trim()) ?? null,
    })),
  };
}

/** The detail as the session list carries it, where `notes` is a retired column. */
export function sessionRowOf({
  notes: _notes,
  entries: _entries,
  area: _area,
  climbs: _climbs,
  ...row
}: SessionDetail): SessionRow {
  return { ...row, notes: null };
}

/** The detail as the list with climbs carries it. */
export function sessionWithClimbsOf(detail: SessionDetail): SessionWithClimbs {
  return { ...sessionRowOf(detail), climbs: detail.climbs };
}

/** A list with the session added or replaced, newest first as the server orders it. */
export function withSession<T extends { fingerprint: string; start_at: string }>(
  sessions: readonly T[],
  session: T
): T[] {
  return [...sessions.filter((s) => s.fingerprint !== session.fingerprint), session].sort((a, b) =>
    b.start_at.localeCompare(a.start_at)
  );
}

export function withoutSession<T extends { fingerprint: string }>(
  sessions: readonly T[],
  fingerprint: string
): T[] {
  return sessions.filter((s) => s.fingerprint !== fingerprint);
}
