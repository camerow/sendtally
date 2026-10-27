import type { SessionLog } from "@sendtally/api-client";
import type { CalendarDate } from "@sendtally/core/hang";
import { t } from "../i18n";
import { countLabel } from "../sessions/years";
import { monthName } from "../sessions/months";
import { summariseActivity } from "./activity";
import { ACTIVITY_KINDS, activitiesOf, oneDecimal, type ActivityKind } from "./overview";

const SPARK_WEEKS = 8;

export type MonthSummaryVM = {
  month: string;
  line: string;
  /** Sessions in each of the last weeks, oldest first, ending with this week. */
  weeks: number[];
};

/** This month at a glance: how many sessions and how hard they felt, over a few weeks' bars. */
export function monthSummaryVM(
  log: SessionLog,
  today: CalendarDate,
  kinds: readonly ActivityKind[] = ACTIVITY_KINDS
): MonthSummaryVM {
  const shown = activitiesOf(log).filter((a) => kinds.includes(a.kind));
  const month = shown.filter((a) => a.date.slice(0, 7) === today.slice(0, 7));
  const scored = month.flatMap((a) => (a.rpe === null ? [] : [a.rpe]));
  const sessions = countLabel(month.length);
  const effort = scored.reduce((sum, rpe) => sum + rpe, 0) / scored.length;
  return {
    month: monthName(Number(today.slice(5, 7))),
    line:
      scored.length === 0
        ? sessions
        : t("statistics.monthLine", { sessions, effort: oneDecimal(effort) }),
    weeks: summariseActivity(shown, kinds, today, SPARK_WEEKS).weeks.map((w) =>
      kinds.reduce((n, k) => n + w.sessions[k], 0)
    ),
  };
}
