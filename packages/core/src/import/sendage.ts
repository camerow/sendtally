import { gradeIn, nameByDate, rowsByName, type Line, type Record } from "./records";

const SEND_TYPES: globalThis.Record<string, Pick<Record, "kind" | "style">> = {
  onsight: { kind: "send", style: "onsight" },
  flash: { kind: "send", style: "flash" },
  redpoint: { kind: "send", style: "redpoint" },
  repeat: { kind: "send" },
  project: { kind: "attempt" },
};

// One row per climb with no tries count, so one try each. `Area` names the
// session, and comments arrive HTML-encoded.
export function sendageRecords(header: string[], rows: Line[]): Record[] {
  const records = rowsByName(header, rows).map(({ row, get }): Record => {
    const sendType = get("send_type");
    const comments = get("comments");
    return {
      row,
      date: get("date"),
      session: get("area"),
      climb: get("climb"),
      grade: gradeIn(get("grade"), get("climb_type")?.toLowerCase() === "boulder"),
      climb_notes: comments === undefined ? undefined : decodeEntities(decodeEntities(comments)),
      ...(SEND_TYPES[sendType?.toLowerCase() ?? ""] ?? { kind: sendType }),
    };
  });
  return nameByDate(records);
}

const ENTITIES: globalThis.Record<string, number> = {
  amp: 38,
  lt: 60,
  gt: 62,
  quot: 34,
  apos: 39,
  nbsp: 160,
  lsquo: 0x2018,
  rsquo: 0x2019,
  ldquo: 0x201c,
  rdquo: 0x201d,
  ndash: 0x2013,
  mdash: 0x2014,
  hellip: 0x2026,
};

// Once per layer of encoding; Sendage sometimes encodes twice (`&amp;rsquo;`).
function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, name: string) => {
    const code = name.startsWith("#")
      ? Number.parseInt(name.slice(1).replace(/^x/i, "0x"), undefined)
      : ENTITIES[name.toLowerCase()];
    return code === undefined || Number.isNaN(code) ? whole : String.fromCodePoint(code);
  });
}
