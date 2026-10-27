import { climbDiscipline, climbRank } from "@sendtally/core";
import type { CalendarDate } from "@sendtally/core/hang";
import type { SessionClimb, SessionWithClimbs } from "@sendtally/api-client";
import type { CircuitColour } from "../gyms/types";
import { circuitLabel } from "../gyms/transforms";
import { t } from "../i18n";
import { gradeFormatterFor } from "../sessions/grades";
import { weekIndex } from "./activity";

export type TopSendWeekVM = {
  rank: number;
  label: string;
  circuit: CircuitColour | null;
} | null;

export type TopSendVM = {
  weeks: TopSendWeekVM[];
  now: string | null;
  from: string | null;
};

/**
 * The hardest send of each week on an indoor session, read in the discipline sent most indoors.
 * A climb logged on a gym circuit reads as that circuit and wears its colour.
 */
export function topSendVM(
  sessions: readonly SessionWithClimbs[],
  first: CalendarDate,
  count: number
): TopSendVM {
  const sends = sessions
    .filter((s) => s.location !== "outdoor")
    .flatMap((s) =>
      s.climbs
        .filter((c) => c.kind === "send" && c.endurance === undefined && climbRank(c) >= 0)
        .map((climb) => ({ climb, week: weekIndex(first, s.start_at.slice(0, 10), count) }))
    );
  const boulders = sends.filter((s) => climbDiscipline(s.climb) === "boulder").length;
  const discipline = boulders * 2 >= sends.length ? "boulder" : "route";
  const format = gradeFormatterFor(
    sends.map((s) => s.climb),
    discipline
  );
  const best: (SessionClimb | undefined)[] = Array.from({ length: count }, () => undefined);
  for (const { climb, week } of sends) {
    if (week === null || climbDiscipline(climb) !== discipline) continue;
    const held = best[week];
    if (held === undefined || climbRank(climb) > climbRank(held)) best[week] = climb;
  }
  const weeks = best.map((c): TopSendWeekVM => {
    if (c === undefined) return null;
    const rank = climbRank(c);
    return c.circuit === undefined
      ? { rank, label: format.label(rank), circuit: null }
      : { rank, label: circuitLabel(c.circuit), circuit: c.circuit.colour };
  });
  const sent = weeks.filter((w) => w !== null);
  const firstSent = sent[0];
  const lastSent = sent[sent.length - 1];
  return {
    weeks,
    now: lastSent?.label ?? null,
    from:
      firstSent === undefined || sent.length < 2
        ? null
        : t("statistics.topSendFrom", { grade: firstSent.label }),
  };
}
