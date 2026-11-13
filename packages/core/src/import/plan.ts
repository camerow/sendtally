import { disciplineOf, parseGrade, type Grade } from "../grades";
import { parseCsv } from "./csv";
import { eightARecords } from "./eightA";
import { kayaRecords } from "./kaya";
import { mountainProjectRecords } from "./mountainProject";
import { normaliseHeader, recordsOf, SENDTALLY_COLUMNS, type Column, type Record } from "./records";
import type { ImportClimb, ImportFormat, ImportIssue, ImportPlan, ImportSession } from "./types";

// The scale is read from how the grade is written: V4, 6A+ (Font, upper
// case), 5.11b (YDS), 7a (French, lower case). VB is V0. A trailing + or - that
// is not part of a known grade (V4+, 5.11b-) is dropped; Font and French keep
// theirs, since 7A+ and 7A are different grades there.
export function gradeFromText(text: string): Grade | undefined {
  const s = text.trim();
  if (/^vb$/i.test(s)) return { scale: "v", value: 0 };
  const exact = gradeAsWritten(s);
  if (exact !== undefined || !/[+-]$/.test(s)) return exact;
  return gradeAsWritten(s.slice(0, -1).trim());
}

function gradeAsWritten(s: string): Grade | undefined {
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
  return parseGrade(scale, s);
}

// The service each export format comes from, a proper noun in every locale.
export const IMPORT_SERVICES: { [F in Exclude<ImportFormat, "sendtally">]: string } = {
  kaya: "Kaya",
  "8a": "8a.nu",
  mountainProject: "Mountain Project",
};

const HEADERS: [Exclude<ImportFormat, "sendtally">, string[]][] = [
  ["kaya", ["date", "ascent_type", "grade", "climb_name"]],
  ["8a", ["route_boulder", "date", "type", "difficulty"]],
  ["mountainProject", ["date", "route", "rating", "location", "style", "lead_style"]],
];

export function detectFormat(header: string[]): ImportFormat | null {
  const names = header.map(normaliseHeader);
  const found = HEADERS.find(([, columns]) => columns.every((h) => names.includes(h)));
  if (found !== undefined) return found[0];
  if (names.includes("date") && names.includes("grade")) return "sendtally";
  return null;
}

export function planImport(text: string, timeZone: string): ImportPlan {
  const rows = parseCsv(text);
  const header = rows[0];
  const format = header === undefined ? null : detectFormat(header);
  if (header === undefined || format === null) {
    return { format: "sendtally", sessions: [], issues: [{ row: 1, code: "noHeader" }] };
  }
  const records = RECORDS[format](header, rows.slice(1), timeZone);
  const { sessions, issues } = groupSessions(records, format === "sendtally");
  // Not one usable row means the file is some other layout, not a file of
  // mistakes, and one message says so better than a row-by-row list.
  if (sessions.length === 0) {
    return { format, sessions, issues: [{ row: 1, code: "noHeader" }] };
  }
  return { format, sessions, issues };
}

function sendtallyRecords(header: string[], rows: string[][]): Record[] {
  const known = new Set<string>(SENDTALLY_COLUMNS);
  return recordsOf(header, rows, (name) => (known.has(name) ? (name as Column) : undefined));
}

const RECORDS: {
  [F in ImportFormat]: (header: string[], rows: string[][], timeZone: string) => Record[];
} = {
  kaya: kayaRecords,
  "8a": eightARecords,
  mountainProject: mountainProjectRecords,
  sendtally: sendtallyRecords,
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

// Rows carry their session's columns on the first row only; in our own format
// a blank date continues the session above. The session's fields are the first
// value seen.
function groupSessions(
  records: Record[],
  fillDown: boolean
): { sessions: ImportSession[]; issues: ImportIssue[] } {
  const issues: ImportIssue[] = [];
  const sessions = new Map<string, ImportSession>();
  let current: ImportSession | undefined;
  for (const r of records) {
    // A note from a climb's page, which an export writes with no session.
    if (r.kind?.toLowerCase() === "note") continue;
    const continues =
      fillDown && r.date === undefined && r.session === undefined && current !== undefined;
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
  grade: Grade,
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
