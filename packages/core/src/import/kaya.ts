import { recordsOf, type Column, type Record } from "./records";

// Kaya exports ascents only, one per row, with a UTC timestamp. The local date
// of that instant is the session date. Its location column names the boulder or
// formation rather than the crag, so only a gym names the session.
export function kayaRecords(header: string[], rows: string[][], timeZone: string): Record[] {
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

