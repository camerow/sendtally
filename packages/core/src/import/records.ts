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

