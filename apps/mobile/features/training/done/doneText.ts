import { clock, plannedWork, type RunResult, type HangWorkout } from "@sendtally/core/hang";
import { humanDuration } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import type { Stat } from "../components/types";

export function doneStatus(result: RunResult): string {
  if (result.ended) return t("hang.endedEarly");
  return result.pct < 100 ? t("hang.finishedPartial") : t("hang.sessionComplete");
}

/** `planned` is the work of every item the run held, the first one's alone by default. */
export function doneStats(
  w: HangWorkout,
  result: RunResult,
  load: string,
  planned = plannedWork(w)
): Stat[] {
  const hang = w.kind === "hang";
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
export function partialNote(w: HangWorkout, result: RunResult, load: string): string {
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
