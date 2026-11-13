import type { ImportPlan } from "../types";

// One line per session and per climb, so a fixture's expected result reads as a
// table: "date | name | location" then "name | grade | kind style | tries".
export function summary(plan: ImportPlan): string[][] {
  return plan.sessions.map((s) => [
    `${s.date} | ${s.name ?? ""} | ${s.location}`,
    ...s.climbs.map(
      (c) =>
        `${c.name} | ${c.grade.value} | ${[c.kind, c.style].filter(Boolean).join(" ")} | ${c.tries}${c.note === undefined ? "" : ` | ${c.note}`}`
    ),
  ]);
}
