import { t } from "../i18n";
import { setKeyOf } from "../activities/done";
import { nextSet, wallLeft } from "../log-session/exerciseTally";
import type { ClimbDraft, LogSessionDraft } from "../log-session/types";
import { elapsedClock } from "../sessions/years";

/** What a climbing item asks of each set: how many, and the climbs or time that end one. */
export type ClimbPlan = { sets: number; climbs?: number; onS?: number };

/** One set of a climbing card: its climbs, whether it is done, being climbed or to come. */
export type ClimbRow = {
  set: number;
  climbs: ClimbDraft[];
  state: "done" | "current" | "waiting";
  /** "1 of 4 climbs", "9:49 left", "4 climbs", or "-" for a set with nothing to say yet. */
  note: string;
  /** How much of a running time set is behind it, for the bar across its row; null otherwise. */
  fill: number | null;
};

const count = (n: number): string => t("common.climbCount", { count: n });

/**
 * A climbing item's sets as rows: from the tally while it is on this item, else from the climbs
 * it logged, a set climbed counting as done.
 */
export function climbRows(
  draft: LogSessionDraft | null,
  item: number,
  plan: ClimbPlan,
  now: Date
): ClimbRow[] {
  const climbs = (draft?.climbs ?? []).filter((c) => c.item === item);
  const ex = draft?.exercise?.item === item ? draft.exercise : undefined;
  const current = ex?.set ?? null;
  const next = nextSet(climbs, item);
  const sets = Math.max(ex?.sets ?? plan.sets, next - 1);
  const wall = (set: number): number | undefined =>
    draft?.wallTimes?.find((w) => w.item === item && w.set === set)?.onS;
  return Array.from({ length: sets }, (_, i) => {
    const set = i + 1;
    const mine = climbs.filter((c) => (c.set ?? 1) === set);
    const state =
      set === current ? "current" : set < (current ?? next) ? "done" : ("waiting" as const);
    const note = (): string => {
      if (plan.onS !== undefined) {
        const left = state === "current" && ex !== undefined ? wallLeft(ex, now) : null;
        if (left !== null && ex?.setStartedAt !== undefined)
          return t("tally.timeLeft", { time: elapsedClock(left) });
        return elapsedClock(state === "done" ? (wall(set) ?? plan.onS) : plan.onS);
      }
      if (plan.climbs !== undefined) {
        if (state === "done") return "";
        return state === "current" && mine.length > 0
          ? t("tally.climbsOfSet", { n: mine.length, of: plan.climbs })
          : count(plan.climbs);
      }
      return state === "waiting" ? "-" : count(mine.length);
    };
    const left =
      state === "current" && ex?.setStartedAt !== undefined && plan.onS ? wallLeft(ex, now) : null;
    const fill = left === null || !plan.onS ? null : (plan.onS - left) / plan.onS;
    return { set, climbs: mine, state, note: note(), fill };
  });
}

/**
 * The sets each climbing item has behind it, by set key: the tally's item up to the set it is on,
 * any other up to its last set climbed, a circuit by its laps.
 */
export function climbedKeys(draft: LogSessionDraft | null): string[] {
  if (draft === null) return [];
  const items = [...new Set(draft.climbs.flatMap((c) => (c.item === undefined ? [] : [c.item])))];
  const ex = draft.exercise;
  if (ex !== undefined && !items.includes(ex.item)) items.push(ex.item);
  return items.flatMap((item) => {
    const circuit = draft.climbs.find((c) => c.item === item && c.endurance !== undefined);
    const behind =
      circuit !== undefined
        ? (circuit.endurance?.laps.length ?? 0)
        : ex?.item === item
          ? ex.set - 1
          : nextSet(draft.climbs, item) - 1;
    return Array.from({ length: behind }, (_, set) => setKeyOf(item, set));
  });
}

/** "At Crux Boulders" in a climbing workout's title line, or "No gym" when none is set. */
export const gymLine = (name: string | undefined): string =>
  name === undefined ? t("gyms.noGym") : t("workouts.atGym", { gym: name });
