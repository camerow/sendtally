import { clock, plannedWork, type RunResult, type Workout } from "@sendtally/core/hang";
import { humanDuration } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import type { Stat } from "../../components/StatGrid";

export function doneStatus(result: RunResult): string {
  if (result.ended) return t("hang.endedEarly");
  return result.pct < 100 ? t("hang.finishedPartial") : t("hang.sessionComplete");
}

export function doneStats(w: Workout, result: RunResult, load: string): Stat[] {
  const hang = w.kind === "hang";
  const planned = plannedWork(w);
  return [
    { label: t("hang.statDuration"), value: clock(result.seconds, true) },
    { label: hang ? t("hang.statLoad") : t("hang.statWeight"), value: load },
    { label: t("hang.statCompletion"), value: `${result.pct}%` },
    hang
      ? {
          label: t("hang.statOnEdge"),
          value: `${humanDuration(result.work)} / ${humanDuration(planned)}`,
        }
      : { label: t("hang.lifts"), value: `${result.work}/${planned}` },
  ];
}

/** Why a partial is partial, and what it means for the trend. */
export function partialNote(w: Workout, result: RunResult, load: string): string {
  const why = [
    result.misses > 0
      ? w.kind === "hang"
        ? t("hang.cameOffOn", { count: result.misses })
        : t("hang.missedLifts", { count: result.misses })
      : "",
    result.ended ? t("hang.endedAfter", { done: result.setsDone, sets: w.sets }) : "",
  ]
    .filter(Boolean)
    .join(" ");
  return t("hang.partialNote", { why, load }).trim();
}
