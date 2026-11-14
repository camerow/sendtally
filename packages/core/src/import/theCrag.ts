import { gradeIn, nameByDate, rowsByName, type Line, type Record } from "./records";

const SEND = { kind: "send" } as const;
const ATTEMPT = { kind: "attempt" } as const;
const REDPOINT = { kind: "send", style: "redpoint" } as const;

const ASCENTS: globalThis.Record<string, Pick<Record, "kind" | "style">> = {
  onsight: { kind: "send", style: "onsight" },
  flash: { kind: "send", style: "flash" },
  "red point": REDPOINT,
  "pink point": REDPOINT,
  "ground up red point": REDPOINT,
  send: SEND,
  tick: SEND,
  clean: SEND,
  repeat: SEND,
  greenpoint: SEND,
  "greenpoint onsight": SEND,
  "top rope": SEND,
  "top rope clean": SEND,
  "top rope flash": SEND,
  "top rope onsight": SEND,
  "second clean": SEND,
  "lead solo": SEND,
  "roped solo": SEND,
  aid: SEND,
  "aid solo": SEND,
  attempt: ATTEMPT,
  "hang dog": ATTEMPT,
  working: ATTEMPT,
  retreat: ATTEMPT,
  dab: ATTEMPT,
  "second with rest": ATTEMPT,
  "top rope with rest": ATTEMPT,
};

// Each attempt is its own row, so rows for one route on one date fold into one
// climb: a try per row, and a send when any row is one. `Crag Name` names the
// session, and nothing marks a gym, so every session is outdoor.
export function theCragRecords(header: string[], rows: Line[]): Record[] {
  const records: Record[] = [];
  const climbs = new Map<string, Record>();
  for (const { row, get } of rowsByName(header, rows)) {
    const type = get("ascent_type");
    const ascent = ASCENTS[type?.toLowerCase() ?? ""];
    const date = get("ascent_date")?.slice(0, 10);
    const gear = get("ascent_gear_style") ?? get("route_gear_style");
    const record: Record = {
      row,
      date,
      session: get("crag_name"),
      climb: get("route_name"),
      grade: gradeIn(get("ascent_grade") ?? get("route_grade"), gear?.toLowerCase() === "boulder"),
      climb_notes: get("comment"),
      ...(ascent ?? { kind: type }),
    };
    const key = `${date}|${get("route_id") ?? record.climb}`;
    const seen = ascent === undefined || date === undefined ? undefined : climbs.get(key);
    if (seen === undefined) {
      records.push(record);
      if (ascent !== undefined && date !== undefined) climbs.set(key, record);
      continue;
    }
    seen.tries = String(Number(seen.tries ?? "1") + 1);
    if (seen.kind !== "send" && record.kind === "send") Object.assign(seen, ascent);
    if (record.climb_notes !== undefined) {
      seen.climb_notes = [seen.climb_notes, record.climb_notes].filter(Boolean).join("\n");
    }
  }
  return nameByDate(records);
}
