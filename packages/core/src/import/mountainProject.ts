import { nameByDate, rowsByName, type Record } from "./records";

const STYLES: globalThis.Record<string, Pick<Record, "kind" | "style">> = {
  onsight: { kind: "send", style: "onsight" },
  flash: { kind: "send", style: "flash" },
  redpoint: { kind: "send", style: "redpoint" },
  pinkpoint: { kind: "send", style: "redpoint" },
  send: { kind: "send" },
  lead: { kind: "send" },
  tr: { kind: "send" },
  follow: { kind: "send" },
  solo: { kind: "send" },
  "fell/hung": { kind: "attempt" },
  attempt: { kind: "attempt" },
};

// Ticks are outdoor, one try each. The lead style, when there is one, says more
// than the style. `Location` is the area path, and a session is never named
// after just a state or country.
export function mountainProjectRecords(header: string[], rows: string[][]): Record[] {
  const records = rowsByName(header, rows).map(({ row, get }): Record => {
    const style = get("lead_style") ?? get("style");
    return {
      row,
      date: get("date"),
      session: get("location"),
      climb: get("route"),
      grade: mountainProjectGrade(get("your_rating") ?? get("rating")),
      climb_notes: get("notes"),
      ...(STYLES[style?.toLowerCase() ?? ""] ?? { kind: style }),
    };
  });
  return nameByDate(records, areaPath, 2);
}

// "5.10c PG13" loses its protection rating, and a slash or range grade
// ("5.10a/b", "V3-4") reads as its lower end.
function mountainProjectGrade(text: string | undefined): string | undefined {
  const grade = text?.split(/\s+/)[0];
  return grade?.match(/^(V\d+|5\.\d+[a-d]?)[/-][\w.]+$/i)?.[1] ?? grade;
}

function areaPath(location: string): string[] {
  const path = location.split(" > ");
  return path[0] === "International" ? path.slice(2) : path;
}
