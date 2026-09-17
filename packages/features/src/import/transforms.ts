import { disciplineOf, effortGrade, formatGrade, parseGrade, type Grade } from "@sendtally/core";
import type { LogClimbInput } from "@sendtally/api-client";
import { parseCsv } from "./csv";
import type { ImportClimb, ImportFormat, ImportIssue, ImportPlan, ImportSession } from "./types";

export const SENDTALLY_COLUMNS = [
  "date",
  "session",
  "location",
  "gym",
  "start_time",
  "end_time",
  "rpe",
  "tags",
  "session_notes",
  "climb",
  "grade",
  "kind",
  "style",
  "tries",
  "wall",
  "climb_notes",
] as const;

type Column = (typeof SENDTALLY_COLUMNS)[number];

type Record = Partial<globalThis.Record<Column, string>> & { row: number };

type ImportGrade = LogClimbInput["grade"];

// The scale is read from how the grade is written: V4, 6A+ (Font, upper
// case), 5.11b (YDS), 7a (French, lower case). VB is V0. A trailing + or - that
// is not part of a known grade (V4+, 5.11b-) is dropped; Font and French keep
// theirs, since 7A+ and 7A are different grades there.
export function gradeFromText(text: string): ImportGrade | undefined {
  const s = text.trim();
  if (/^vb$/i.test(s)) return { scale: "v", value: 0 };
  const exact = gradeAsWritten(s);
  if (exact !== undefined || !/[+-]$/.test(s)) return exact;
  return gradeAsWritten(s.slice(0, -1).trim());
}

function gradeAsWritten(s: string): ImportGrade | undefined {
  if (s === "") return undefined;
  const scale = /^v\d+$/i.test(s)
    ? "v"
    : /^5\.\d/.test(s)
      ? "yds"
      : /^\d[ABC]\+?$/.test(s)
        ? "font"
        : /^\d[abc]\+?$/.test(s)
          ? "french"
          : undefined;
  if (scale === undefined) return undefined;
  const grade: Grade | undefined = parseGrade(scale, s);
  return grade;
}

const KAYA_HEADERS = ["date", "ascent_type", "grade", "climb_name"];

export function detectFormat(header: string[]): ImportFormat | null {
  const names = header.map(normaliseHeader);
  if (KAYA_HEADERS.every((h) => names.includes(h))) return "kaya";
  if (names.includes("date") && names.includes("grade")) return "sendtally";
  return null;
}

function normaliseHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "_");
}

export function planImport(text: string, timeZone: string): ImportPlan {
  const rows = parseCsv(text);
  const header = rows[0];
  const format = header === undefined ? null : detectFormat(header);
  if (header === undefined || format === null) {
    return { format: "sendtally", sessions: [], issues: [{ row: 1, code: "noHeader" }] };
  }
  const records =
    format === "kaya"
      ? kayaRecords(header, rows.slice(1), timeZone)
      : sendtallyRecords(header, rows.slice(1));
  const { sessions, issues } = groupSessions(records);
  // Not one usable row means the file is some other layout, not a file of
  // mistakes, and one message says so better than a row-by-row list.
  if (sessions.length === 0) {
    return { format, sessions, issues: [{ row: 1, code: "noHeader" }] };
  }
  return { format, sessions, issues };
}

function recordsOf(
  header: string[],
  rows: string[][],
  pick: (name: string) => Column | undefined
): Record[] {
  const columns = header.map((h) => pick(normaliseHeader(h)));
  return rows.map((cells, i) => {
    const record: Record = { row: i + 2 };
    columns.forEach((col, j) => {
      const value = cells[j]?.trim() ?? "";
      if (col !== undefined && value !== "") record[col] = value;
    });
    return record;
  });
}

function sendtallyRecords(header: string[], rows: string[][]): Record[] {
  const known = new Set<string>(SENDTALLY_COLUMNS);
  return recordsOf(header, rows, (name) => (known.has(name) ? (name as Column) : undefined));
}

// Kaya exports ascents only, one per row, with a UTC timestamp. The local date
// of that instant is the session date. Its location column names the boulder or
// formation rather than the crag, so only a gym names the session.
function kayaRecords(header: string[], rows: string[][], timeZone: string): Record[] {
  const map: globalThis.Record<string, Column> = {
    date: "date",
    grade: "grade",
    climb_name: "climb",
    attempts: "tries",
    ascent_type: "style",
    gym: "gym",
  };
  return recordsOf(header, rows, (name) => map[name]).map(({ style, tries, date, ...rest }) => {
    const local = date === undefined ? undefined : localDate(date, timeZone);
    return {
      ...rest,
      ...(local === undefined ? {} : { date: local }),
      ...(rest.gym === undefined ? {} : { session: rest.gym }),
      location: rest.gym === undefined ? "outdoor" : "indoor",
      kind: "send",
      ...(tries === undefined ? {} : { tries }),
      ...kayaStyle(style),
    };
  });
}

function kayaStyle(style: string | undefined): Pick<Record, "style" | "tries"> {
  switch (style?.toLowerCase()) {
    case "flash":
      return { style: "flash", tries: "1" };
    case "onsight":
      return { style: "onsight", tries: "1" };
    case "repeat":
      return { tries: "1" };
    default:
      return { style: "redpoint" };
  }
}

function localDate(text: string, timeZone: string): string | undefined {
  const t = Date.parse(text);
  if (Number.isNaN(t)) return text;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(t));
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

// Rows carry their session's columns on the first row only; a blank date
// continues the session above. The session's fields are the first value seen.
function groupSessions(records: Record[]): { sessions: ImportSession[]; issues: ImportIssue[] } {
  const issues: ImportIssue[] = [];
  const sessions = new Map<string, ImportSession>();
  let current: ImportSession | undefined;
  for (const r of records) {
    const continues = r.date === undefined && r.session === undefined && current !== undefined;
    const date = continues ? current!.date : r.date;
    if (date === undefined) {
      issues.push({ row: r.row, code: "missingDate" });
      continue;
    }
    if (!DATE.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
      issues.push({ row: r.row, code: "badDate", value: date });
      continue;
    }
    const name = continues ? current!.name : r.session;
    const key = `${date}|${name ?? ""}`;
    let session = sessions.get(key);
    if (session === undefined) {
      const head = sessionHead(r, date, name, issues);
      if (head === undefined) continue;
      session = head;
      sessions.set(key, session);
    }
    current = session;
    const climb = climbOf(r, issues);
    if (climb === undefined) continue;
    session.climbs.push(climb);
    session.rows.push(r.row);
  }
  const kept = [...sessions.values()].filter((s) => s.climbs.length > 0);
  kept.sort((a, b) => a.date.localeCompare(b.date));
  return { sessions: kept, issues: issues.sort((a, b) => a.row - b.row) };
}

function sessionHead(
  r: Record,
  date: string,
  name: string | undefined,
  issues: ImportIssue[]
): ImportSession | undefined {
  const location = r.location?.toLowerCase() ?? (r.gym === undefined ? "outdoor" : "indoor");
  if (location !== "indoor" && location !== "outdoor") {
    issues.push({ row: r.row, code: "badLocation", value: r.location });
    return undefined;
  }
  for (const time of [r.start_time, r.end_time]) {
    if (time !== undefined && !TIME.test(time)) {
      issues.push({ row: r.row, code: "badTime", value: time });
      return undefined;
    }
  }
  const rpe = r.rpe === undefined ? undefined : Number(r.rpe);
  if (rpe !== undefined && !(Number.isInteger(rpe) && rpe >= 1 && rpe <= 10)) {
    issues.push({ row: r.row, code: "badRpe", value: r.rpe });
    return undefined;
  }
  const tags = r.tags
    ?.split(/[;|]/)
    .map((t) => t.trim())
    .filter((t) => t !== "");
  return {
    date,
    ...(name === undefined ? {} : { name: name.slice(0, 120) }),
    location,
    ...(r.gym === undefined ? {} : { gym: r.gym }),
    ...(r.start_time === undefined ? {} : { startTime: r.start_time }),
    ...(r.end_time === undefined ? {} : { endTime: r.end_time }),
    ...(rpe === undefined ? {} : { rpe }),
    ...(tags === undefined || tags.length === 0 ? {} : { tags }),
    ...(r.session_notes === undefined ? {} : { notes: r.session_notes }),
    climbs: [],
    rows: [],
  };
}

function climbOf(r: Record, issues: ImportIssue[]): ImportClimb | undefined {
  const name = r.climb ?? "";
  const fail = (code: ImportIssue["code"], value?: string): undefined => {
    issues.push({ row: r.row, code, ...(value === undefined ? {} : { value }), climb: name });
    return undefined;
  };
  if (r.grade === undefined) return fail("missingGrade");
  const grade = gradeFromText(r.grade);
  if (grade === undefined) return fail("unknownGrade", r.grade);
  const kind = kindOf(r.kind);
  if (kind === undefined) return fail("badKind", r.kind);
  const tries = r.tries === undefined ? 1 : Number(r.tries);
  if (!(Number.isInteger(tries) && tries >= 1 && tries <= 99)) return fail("badTries", r.tries);
  const style = kind === "attempt" ? undefined : styleOf(r.style, grade, tries);
  if (style === null) return fail("badStyle", r.style);
  return {
    name: name.slice(0, 200),
    grade,
    kind,
    ...(style === undefined ? {} : { style }),
    tries,
    ...(r.wall === undefined ? {} : { wall: r.wall.slice(0, 40) }),
    ...(r.climb_notes === undefined ? {} : { note: r.climb_notes.slice(0, 2000) }),
  };
}

function kindOf(text: string | undefined): "send" | "attempt" | undefined {
  switch (text?.toLowerCase()) {
    case undefined:
    case "send":
    case "sent":
    case "y":
    case "yes":
    case "true":
      return "send";
    case "attempt":
    case "project":
    case "n":
    case "no":
    case "false":
      return "attempt";
    default:
      return undefined;
  }
}

// A flash or onsight is one try by definition; more tries makes it a
// redpoint rather than an error, since that is what the climber meant.
function styleOf(
  text: string | undefined,
  grade: ImportGrade,
  tries: number
): "flash" | "onsight" | "redpoint" | undefined | null {
  const style = text?.toLowerCase();
  if (style === undefined || style === "") return undefined;
  if (style === "redpoint") return "redpoint";
  if (style !== "flash" && style !== "onsight") return null;
  if (tries > 1) return "redpoint";
  if (style === "onsight" && disciplineOf(grade.scale) !== "route") return "flash";
  return style;
}

export type PlanStats = { sessions: number; climbs: number; topGrade: string | null };

export function planStats(sessions: ImportSession[]): PlanStats {
  let top: ImportGrade | undefined;
  let climbs = 0;
  for (const s of sessions) {
    for (const c of s.climbs) {
      climbs++;
      if (top === undefined || effortGrade(c.grade) > effortGrade(top)) top = c.grade;
    }
  }
  return {
    sessions: sessions.length,
    climbs,
    topGrade: top === undefined ? null : formatGrade(top),
  };
}
