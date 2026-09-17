import { formatGrade } from "@sendtally/core";
import { parseClimbs } from "./manual";
import type { ClimbNoteRow, GymRow, SessionRow, TagRow } from "./repo";
import { climbSlug } from "./climbs";

// The importer's columns first, so an export re-imports as is, then what a
// climber would miss if it were gone.
export const EXPORT_COLUMNS = [
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
  "circuit",
  "title",
  "source",
  "session_id",
] as const;

export type ExportInput = {
  sessions: Array<SessionRow & { climbs_json?: string | null }>;
  tagsBySession: Map<string, TagRow[]>;
  notesBySession: Map<string, string>;
  climbNotes: ClimbNoteRow[];
  gyms: GymRow[];
};

const cell = (v: string | number | null | undefined): string => {
  const s = v == null ? "" : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const hhmm = (iso: string): string => iso.slice(11, 16);

export function exportCsv(input: ExportInput): string {
  const gymName = new Map(input.gyms.map((g) => [g.id, g.name]));
  const climbNote = new Map(
    input.climbNotes.map((n) => [`${n.fingerprint}|${n.climb_slug}`, n.note])
  );
  const lines = [EXPORT_COLUMNS.map(cell).join(",")];
  const ordered = [...input.sessions].sort((a, b) => a.start_at.localeCompare(b.start_at));
  for (const s of ordered) {
    const session = [
      s.start_at.slice(0, 10),
      s.name ?? "",
      s.location ?? "",
      s.gym_id === null ? "" : (gymName.get(s.gym_id) ?? ""),
      hhmm(s.start_at),
      hhmm(s.end_at),
      s.rpe,
      (input.tagsBySession.get(s.fingerprint) ?? []).map((t) => t.name).join("; "),
      input.notesBySession.get(s.fingerprint) ?? "",
    ];
    const trailer = [s.title, s.source, s.fingerprint];
    for (const c of parseClimbs(s.climbs_json)) {
      const grade =
        c.grade === undefined ? formatGrade({ scale: "v", value: c.vGrade }) : formatGrade(c.grade);
      const row = [
        ...session,
        c.name,
        grade,
        c.kind,
        c.style ?? "",
        c.tries,
        c.wall ?? "",
        climbNote.get(`${s.fingerprint}|${climbSlug(c.name)}`) ?? "",
        c.circuit === undefined ? "" : c.circuit.label || c.circuit.colour,
        ...trailer,
      ];
      lines.push(row.map(cell).join(","));
    }
  }
  return lines.join("\r\n") + "\r\n";
}
