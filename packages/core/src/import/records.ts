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

export type Column = (typeof SENDTALLY_COLUMNS)[number];

export type Record = Partial<globalThis.Record<Column, string>> & { row: number };

export function recordsOf(
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

export function normaliseHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "_");
}

export type Row = { row: number; get: (name: string) => string | undefined };

// Cells by header name, for a service export whose columns are not ours.
export function rowsByName(header: string[], rows: string[][]): Row[] {
  const names = header.map(normaliseHeader);
  return rows.map((cells, i) => ({
    row: i + 2,
    get: (name) => cells[names.indexOf(name)]?.trim() || undefined,
  }));
}

// Rows on one date form one session, named after the deepest area all of them
// share. Each record arrives with its area path in `session`; `minDepth` keeps
// a path too shallow to name a crag from naming the session.
export function nameByDate(
  records: Record[],
  path: (area: string) => string[] = (area) => [area],
  minDepth = 1
): Record[] {
  const shared = new Map<string | undefined, string[]>();
  for (const r of records) {
    const area = r.session === undefined ? [] : path(r.session);
    const seen = shared.get(r.date);
    shared.set(r.date, seen === undefined ? area : area.slice(0, prefixLength(seen, area)));
  }
  return records.map(({ session: _area, ...r }) => {
    const area = shared.get(r.date) ?? [];
    return area.length < minDepth ? r : { ...r, session: area[area.length - 1] };
  });
}

function prefixLength(a: string[], b: string[]): number {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) n++;
  return n;
}

// The discipline settles a grade whose text reads as the other one: a 6c
// boulder is Font 6C, a 7A route French 7a.
export function gradeIn(text: string | undefined, boulder: boolean): string | undefined {
  if (text === undefined || !/^\d[abc]\+?$/i.test(text)) return text;
  return boulder ? text.toUpperCase() : text.toLowerCase();
}
