import { t } from "../i18n";
import { setKeyOf } from "../activities/done";
import { climbingSet, nextSet } from "../log-session/exerciseTally";
import type { ClimbDraft, LogSessionDraft } from "../log-session/types";

/** What a climbing item asks of each set: how many, and the climbs or time that end one. */
export type ClimbPlan = { sets: number; climbs?: number; onS?: number };

/** One set of a climbing card: its climbs, whether it ended, is being climbed or is to come. */
export type ClimbRow = {
  set: number;
  climbs: ClimbDraft[];
  state: "done" | "current" | "waiting";
  /** The grades picked go to this set. */
  picked: boolean;
  /** A time set that ended: its time on the wall. */
  onS: number | null;
};

/**
 * A climbing item's sets as rows: from the tally while it is on this item, else from the climbs
 * it logged, a set climbed counting as done.
 */
export function climbRows(
  draft: LogSessionDraft | null,
  item: number,
  plan: ClimbPlan
): ClimbRow[] {
  const climbs = (draft?.climbs ?? []).filter((c) => c.item === item);
  const ex = draft?.exercise?.item === item ? draft.exercise : undefined;
  const next = nextSet(climbs, item);
  const current = ex?.set ?? next;
  const sets = Math.max(ex?.sets ?? plan.sets, next - 1);
  const wall = (set: number): number | undefined =>
    draft?.wallTimes?.find((w) => w.item === item && w.set === set)?.onS;
  return Array.from({ length: sets }, (_, i) => {
    const set = i + 1;
    const state =
      set === current && ex !== undefined
        ? "current"
        : set < current
          ? "done"
          : ("waiting" as const);
    return {
      set,
      climbs: climbs.filter((c) => (c.set ?? 1) === set),
      state,
      picked: ex !== undefined && climbingSet(ex) === set,
      onS: state === "done" && plan.onS !== undefined ? (wall(set) ?? plan.onS) : null,
    };
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
