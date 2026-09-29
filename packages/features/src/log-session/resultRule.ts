import type { ClimbDraft, ClimbOutcome, ClimbStyle, Discipline } from "./types";

export type FirstGoStyle = Extract<ClimbStyle, "flash" | "onsight">;

export function firstGoStyleOf(climb: Pick<ClimbDraft, "style">): FirstGoStyle {
  return climb.style === "flash" ? "flash" : "onsight";
}

export function resultOutcome(
  discipline: Discipline,
  sent: boolean,
  tries: number,
  firstGo: FirstGoStyle
): ClimbOutcome {
  if (!sent) return { kind: "attempt" };
  if (tries > 1) return { kind: "send", style: "redpoint" };
  return { kind: "send", style: discipline === "route" ? firstGo : "flash" };
}
