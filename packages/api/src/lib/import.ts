import type { ImportSession } from "@sendtally/core/import";
import { z } from "zod";
import { manualSessionShape, sessionTooLong, type ManualSessionBody } from "./manual";

export const IMPORT_BATCH_MAX = 200;

// The log form's body with the gym as a name: a CSV cannot know our ids, so
// the Worker matches it against the user's gyms. Areas are not imported.
export const importSessionShape = manualSessionShape
  .omit({ gymId: true })
  .extend({ gym: z.string().trim().min(1).max(80).optional() })
  .superRefine((body, ctx) => {
    sessionTooLong(body, ctx);
    body.climbs.forEach((climb, i) => {
      if (climb.areaId === undefined) return;
      ctx.addIssue({
        code: "custom",
        path: ["climbs", i, "areaId"],
        message: "areas are not imported",
      });
    });
  });

export const importBody = z.object({
  sessions: z.array(importSessionShape).min(1).max(IMPORT_BATCH_MAX),
});

export type ImportSessionBody = z.infer<typeof importSessionShape>;

export type ImportBody = z.input<typeof importBody>;

type Agrees<T extends U, U> = T;

// The core planner's sessions, less their row numbers, are what this endpoint
// takes, whether /app/import or the connector planned them.
export type PlannedImportSession = Agrees<
  Omit<ImportSession, "rows">,
  ImportBody["sessions"][number]
>;

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function manualBodyOf(
  session: ImportSessionBody,
  gymIdByName: Map<string, string>
): ManualSessionBody {
  const { gym, ...rest } = session;
  const gymId = gym === undefined ? undefined : gymIdByName.get(gym.toLowerCase());
  const name = rest.name ?? (gymId === undefined ? gym : undefined);
  return {
    ...rest,
    ...(name === undefined ? {} : { name }),
    ...(gymId === undefined ? {} : { gymId }),
  };
}
