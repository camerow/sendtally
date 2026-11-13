import { climbGrade, type GradedClimb } from "../effort";
import type { ImportSession } from "./types";

// A session as the log lists it; start_at holds the logged wall time as UTC,
// so its first ten characters are the date the user logged.
export type LoggedSession = {
  fingerprint: string;
  title: string;
  start_at: string;
  climbs: (GradedClimb & { name: string })[];
};

export type LikelyDuplicate = { index: number; logged: LoggedSession };

// The same rows produce the same fingerprint, so importing a file twice adds
// nothing the second time. The user's edits afterwards do not change it. The
// hash is passed in because each platform has its own SHA-256.
export async function importFingerprint(
  session: Pick<ImportSession, "date" | "name" | "climbs">,
  sha256Hex: (text: string) => Promise<string>
): Promise<string> {
  const canonical = JSON.stringify([
    session.date,
    session.name ?? "",
    session.climbs.map((c) => [c.name, c.grade.scale, c.grade.value, c.kind, c.tries]),
  ]);
  return `import-${(await sha256Hex(canonical)).slice(0, 32)}`;
}

// A planned session looks like one already in the log when a logged session on
// the same date matches more than half of its climbs, each climb used once: the
// same grade, and the same name when both climbs have one. A session its
// fingerprint already skips is left out, since it never imports anyway.
export async function likelyDuplicates(
  planned: ImportSession[],
  logged: LoggedSession[],
  sha256Hex: (text: string) => Promise<string>
): Promise<LikelyDuplicate[]> {
  const fingerprints = new Set(logged.map((s) => s.fingerprint));
  const flagged: LikelyDuplicate[] = [];
  for (const [index, session] of planned.entries()) {
    if (fingerprints.has(await importFingerprint(session, sha256Hex))) continue;
    const match = logged.find(
      (s) =>
        s.start_at.slice(0, 10) === session.date &&
        matches(session.climbs, s.climbs) * 2 > session.climbs.length
    );
    if (match !== undefined) flagged.push({ index, logged: match });
  }
  return flagged;
}

const nameOf = (climb: { name: string }): string => climb.name.trim().toLowerCase();

// Named climbs go first and prefer a climb of the same name, so an unnamed one
// never takes the logged climb a named one needed.
function matches(planned: ImportSession["climbs"], logged: LoggedSession["climbs"]): number {
  const left = logged.map((c) => ({ name: nameOf(c), grade: climbGrade(c) }));
  const ordered = [...planned].sort((a, b) => Number(nameOf(a) === "") - Number(nameOf(b) === ""));
  let count = 0;
  for (const climb of ordered) {
    const name = nameOf(climb);
    const fits = (c: (typeof left)[number], sameName: boolean): boolean =>
      c.grade.scale === climb.grade.scale &&
      c.grade.value === climb.grade.value &&
      (sameName ? name !== "" && c.name === name : c.name === "" || name === "");
    const named = left.findIndex((c) => fits(c, true));
    const at = named !== -1 ? named : left.findIndex((c) => fits(c, false));
    if (at === -1) continue;
    left.splice(at, 1);
    count++;
  }
  return count;
}
