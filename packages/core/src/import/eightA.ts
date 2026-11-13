import { gradeIn, nameByDate, rowsByName, type Record } from "./records";

const TYPES: globalThis.Record<string, Pick<Record, "kind" | "style">> = {
  os: { kind: "send", style: "onsight" },
  f: { kind: "send", style: "flash" },
  rp: { kind: "send", style: "redpoint" },
  tr: { kind: "send" },
  go: { kind: "attempt" },
};

// One file for routes and boulders. A missing value is blank or the string
// "null", the date's time means nothing, and `tries` is not a real count, so
// every climb is one try. `area_name` names the session.
export function eightARecords(header: string[], rows: string[][]): Record[] {
  const records = rowsByName(header, rows).map(({ row, get: cell }): Record => {
    const get = (name: string): string | undefined => {
      const value = cell(name);
      return value === "null" ? undefined : value;
    };
    const type = get("type");
    return {
      row,
      date: get("date")?.slice(0, 10),
      session: get("area_name"),
      climb: get("name"),
      grade: gradeIn(get("difficulty"), get("route_boulder")?.toUpperCase() === "BOULDER"),
      climb_notes: get("comment"),
      ...(TYPES[type?.toLowerCase() ?? ""] ?? { kind: type }),
    };
  });
  return nameByDate(records);
}
