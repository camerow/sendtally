import { parseCsv, toCsv } from "./csv";
import { planImport } from "./plan";
import { SENDTALLY_COLUMNS, type Column, type Line } from "./records";
import type { ClimbResult, ColumnMatch, DateOrder, GradeColumn, ImportPlan } from "./types";

export const MATCH_SAMPLE_ROWS = 20;

// A spreadsheet in any layout: its first non-blank line is the header.
export type Sheet = { header: string[]; headerRow: number; rows: Line[] };

export function sheetOf(text: string): Sheet | null {
  const lines = parseCsv(text)
    .map((cells, i) => ({ row: i + 1, cells }))
    .filter(({ cells }) => cells.some((c) => c.trim() !== ""));
  const [head, ...rows] = lines;
  if (head === undefined) return null;
  return { header: head.cells.map((h) => h.trim()), headerRow: head.row, rows };
}

export const matchSample = (sheet: Sheet): { header: string[]; rows: string[][] } => ({
  header: sheet.header,
  rows: sheet.rows.slice(0, MATCH_SAMPLE_ROWS).map((r) => r.cells),
});

const cellOf =
  (sheet: Sheet) =>
  (line: Line, column: string | null | undefined): string => {
    if (column == null) return "";
    const at = sheet.header.indexOf(column);
    return at < 0 ? "" : (line.cells[at]?.trim() ?? "");
  };

export function firstValue(sheet: Sheet, column: string): string | undefined {
  const cell = cellOf(sheet);
  return sheet.rows.map((r) => cell(r, column)).find((v) => v !== "");
}

export function usedColumns(match: ColumnMatch): string[] {
  const used = [
    match.date,
    match.climb,
    match.grade.column,
    match.otherGrade?.column,
    match.result?.column,
    match.tries,
    match.where?.column,
    match.notes,
  ];
  return used.filter((c): c is string => c != null);
}

export const unusedColumns = (sheet: Sheet, match: ColumnMatch): string[] => {
  const used = new Set(usedColumns(match));
  return sheet.header.filter((h) => h !== "" && !used.has(h));
};

const ISO = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T].*)?$/;
const DAY_MONTH = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})(?:[ T].*)?$/;

// Whether the file's own dates settle day-first or month-first: one 13 or more in a place
// does. Undefined when no date depends on the order, "ask" when the file cannot say.
export function dateOrderOf(sheet: Sheet, column: string): DateOrder | "ask" | undefined {
  const cell = cellOf(sheet);
  for (const line of sheet.rows) {
    const m = DAY_MONTH.exec(cell(line, column));
    if (m !== null && Number(m[1]) > 12) return "dmy";
    if (m !== null && Number(m[2]) > 12) return "mdy";
  }
  return ambiguousDate(sheet, column) === undefined ? undefined : "ask";
}

/** The first date whose day and month could swap, such as 03/04/22. */
export function ambiguousDate(sheet: Sheet, column: string): string | undefined {
  const cell = cellOf(sheet);
  return sheet.rows
    .map((line) => cell(line, column))
    .find((text) => {
      const m = DAY_MONTH.exec(text);
      return m !== null && m[1] !== m[2] && Number(m[1]) <= 12 && Number(m[2]) <= 12;
    });
}

const pad = (n: number): string => String(n).padStart(2, "0");

const isoOf = (year: number, month: number, day: number): string | undefined =>
  month >= 1 && month <= 12 && day >= 1 && day <= 31
    ? `${year}-${pad(month)}-${pad(day)}`
    : undefined;

// A date the importer reads, or the text as written so its review names the row.
export function dateIn(text: string, order: DateOrder): string {
  const iso = ISO.exec(text);
  if (iso !== null) return isoOf(Number(iso[1]), Number(iso[2]), Number(iso[3])) ?? text;
  const dm = DAY_MONTH.exec(text);
  if (dm === null) return text;
  const [first, second] = [Number(dm[1]), Number(dm[2])];
  const short = Number(dm[3]);
  const year = dm[3]!.length === 4 ? short : short < 70 ? 2000 + short : 1900 + short;
  const [day, month] = order === "dmy" ? [first, second] : [second, first];
  return isoOf(year, month, day) ?? text;
}

// The column's scale settles a grade written short: 4 in a V column is V4, 11b in a YDS
// column is 5.11b, 6c in a Font column is 6C.
export function gradeIn(text: string, scale: GradeColumn["scale"]): string {
  if (scale === "v" && /^\d{1,2}$/.test(text)) return `V${text}`;
  if (scale === "yds" && /^\d{1,2}[abcd]?[+-]?$/i.test(text)) return `5.${text.toLowerCase()}`;
  if (scale === "font" && /^\d[abc]?\+?$/i.test(text)) return text.toUpperCase();
  if (scale === "french" && /^\d[abc]?\+?$/i.test(text)) return text.toLowerCase();
  return text;
}

const RESULT_WORDS = new Set<string>(["flash", "onsight", "redpoint"]);

function resultIn(text: string, match: ColumnMatch["result"]): Partial<Record<Column, string>> {
  const said = text.toLowerCase();
  const means: ClimbResult | string =
    match?.values.find((v) => v.value.trim().toLowerCase() === said)?.means ?? said;
  if (RESULT_WORDS.has(means)) return { kind: "send", style: means };
  return means === "" ? {} : { kind: means };
}

/**
 * The sheet rewritten in our own columns, row for row, so the importer reads it as a
 * sendtally file and its issues name the user's own row numbers. A date or place written
 * only on a day's first climb fills down; a row with no grade and no name is left out.
 */
export function applyMatch(sheet: Sheet, match: ColumnMatch, order: DateOrder): string {
  const cell = cellOf(sheet);
  const out: string[][] = Array.from(
    { length: sheet.rows.at(-1)?.row ?? sheet.headerRow },
    () => []
  );
  out[sheet.headerRow - 1] = [...SENDTALLY_COLUMNS];
  let date = "";
  let where = "";
  for (const line of sheet.rows) {
    const written = cell(line, match.date);
    if (written !== "") {
      date = dateIn(written, order);
      where = cell(line, match.where?.column);
    } else where = cell(line, match.where?.column) || where;
    const climb = cell(line, match.climb);
    const grade =
      gradeIn(cell(line, match.grade.column), match.grade.scale) ||
      (match.otherGrade === null
        ? ""
        : gradeIn(cell(line, match.otherGrade.column), match.otherGrade.scale));
    if (grade === "" && climb === "") continue;
    const record: Partial<Record<Column, string>> = {
      date,
      climb,
      grade,
      tries: cell(line, match.tries),
      climb_notes: cell(line, match.notes),
      ...resultIn(cell(line, match.result?.column), match.result),
      ...(match.where?.kind === "gym" ? { gym: where } : { session: where }),
    };
    out[line.row - 1] = SENDTALLY_COLUMNS.map((c) => record[c] ?? "");
  }
  return toCsv(out);
}

/** The whole sheet read through the match, by the same rules as a file in our own columns. */
export const planMatched = (
  sheet: Sheet,
  match: ColumnMatch,
  order: DateOrder,
  timeZone: string
): ImportPlan => ({
  ...planImport(applyMatch(sheet, match, order), timeZone),
  format: "spreadsheet",
});
