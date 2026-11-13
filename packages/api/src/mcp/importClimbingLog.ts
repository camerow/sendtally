import { planImport } from "@sendtally/core/import";
import { z } from "zod";
import { IMPORT_BATCH_MAX, importSessionShape, type ImportSessionBody } from "../lib/import";
import { importSessions } from "../sessions";
import type { ConnectorTool } from "./types";

const inputSchema = {
  csv: z.string().min(1).describe("The CSV text, header row first."),
  timeZone: z
    .string()
    .describe("The user's IANA time zone, such as Europe/London. Kaya dates are read in it."),
  dryRun: z
    .boolean()
    .default(false)
    .describe("Check the file and return what would be imported, writing nothing."),
};

const description = `Imports a climbing log into the user's Sendtally account from CSV text. Exports from Kaya, 8a.nu, Mountain Project, Sendage and theCrag are recognised by their header: pass them through unchanged. Convert anything else (a spreadsheet, a journal, notes) to the Sendtally format first.

Sendtally format: one row per climb, header row exactly:
date,session,location,gym,start_time,end_time,rpe,tags,session_notes,climb,grade,kind,style,tries,climb_notes

Conversion rules:
- date is YYYY-MM-DD. Every row carries its date; if the source only writes the date on the first climb of a day, fill it down.
- Climbs on the same date belong to one session. Put the crag, area or gym name in session (fill it down too). location is "outdoor" for crags and "indoor" for gyms; gym is the gym name for indoor sessions.
- grade is written as logged: V4, 6A+, 5.11b, 7a. Do not convert between scales. If the source has separate boulder and route grade columns, use whichever is filled. A YDS grade written without the "5." prefix, like "11b", is "5.11b".
- kind is "send" when the climb was topped and "attempt" when it was not (a "y/n" sent column, "project", "fell", "no send"). Default to send.
- style is "flash" when sent first try with prior knowledge, "onsight" (routes only) when sent first try with none, "redpoint" for any other send. Leave it blank if the source does not say. A repeat is a send with tries 1.
- tries is the number of attempts that day, a whole number. Blank means 1.
- start_time and end_time are HH:MM, 24 hour; leave them blank if unknown. A session is at most 12 hours.
- rpe is only filled when the source records effort on a 1-10 scale. Otherwise leave it blank.
- tags are separated by ";".
- session_notes holds anything written about the day; climb_notes anything written about that climb. Quote fields that contain commas or line breaks.
- Skip rows with no grade and no climb name. Do not invent values.

Rows with problems are skipped and returned in issues with their row number (row 1 is the first line of the text). Run with dryRun first, fix every issue, then import the corrected text: the rest of a session imports without its bad rows, and a fixed row sent later on its own becomes a separate session. The same rows never import twice, so a resend or a retry is safe. Send a large file in chunks of up to ${IMPORT_BATCH_MAX} sessions, each with the header row, keeping all of one day's rows in one chunk. Try dryRun first to check a converted file. Imported sessions are never posted to Strava.`;

export const importClimbingLog: ConnectorTool<typeof inputSchema> = {
  name: "import_climbing_log",
  title: "Import a climbing log",
  description,
  inputSchema,
  annotations: { readOnlyHint: false, destructiveHint: false },
  run: async ({ csv, timeZone, dryRun }, { c }) => {
    const plan = planImport(csv, timeZone);
    const issues: { row: number; code: string; value?: string; climb?: string }[] = [
      ...plan.issues,
    ];
    const sessions: ImportSessionBody[] = [];
    for (const { rows, ...planned } of plan.sessions) {
      const parsed = importSessionShape.safeParse(planned);
      if (parsed.success) sessions.push(parsed.data);
      else
        for (const { path, message } of parsed.error.issues) {
          const row = path[0] === "climbs" ? rows[Number(path[1])] : rows[0];
          issues.push({ row: row ?? 1, code: "invalidSession", value: message });
        }
    }
    if (sessions.length > IMPORT_BATCH_MAX) {
      return {
        error: `${sessions.length} sessions is more than ${IMPORT_BATCH_MAX}; send the file in chunks.`,
      };
    }
    if (dryRun || sessions.length === 0) {
      const climbs = sessions.reduce((n, s) => n + s.climbs.length, 0);
      return { format: plan.format, sessions: sessions.length, climbs, issues };
    }
    return { format: plan.format, ...(await importSessions(c, sessions)), issues };
  },
};
