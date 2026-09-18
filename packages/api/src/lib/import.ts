import { z } from "zod";
import { manualSessionShape, sessionTooLong, type ManualSessionBody } from "./manual";

export const IMPORT_BATCH_MAX = 200;

// The log form's body with the gym as a name: a CSV cannot know our ids, so
// the Worker matches it against the user's gyms. Areas are not imported.
const importSessionShape = manualSessionShape
  .omit({ gymId: true, areaId: true })
  .extend({ gym: z.string().trim().min(1).max(80).optional() })
  .superRefine(sessionTooLong);

export const importBody = z.object({
  sessions: z.array(importSessionShape).min(1).max(IMPORT_BATCH_MAX),
});

export type ImportSessionBody = z.infer<typeof importSessionShape>;

export type ImportBody = z.input<typeof importBody>;

// The same rows produce the same fingerprint, so importing a file twice adds
// nothing the second time. The user's edits afterwards do not change it.
export async function importFingerprint(session: ImportSessionBody): Promise<string> {
  const canonical = JSON.stringify([
    session.date,
    session.name ?? "",
    session.climbs.map((c) => [c.name, c.grade.scale, c.grade.value, c.kind, c.tries]),
  ]);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `import-${hex.slice(0, 32)}`;
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
