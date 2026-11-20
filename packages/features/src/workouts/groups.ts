import {
  letterOf,
  restAfterItem,
  type ItemDone,
  type ItemGroup,
  type SessionItem,
} from "@sendtally/core/hang";
import { t } from "../i18n";
import { afterKey, itemDone, setKey, type SetAt } from "./setsRun";

/** A superset as the run has it now: its members in the cards' order, and its rests. */
export type RunGroup = Omit<ItemGroup, "rounds"> & { members: number[] };

/**
 * The supersets of a run: neighbours in the cards' order that share a group. One skipped to the
 * end, or the last left after another went, plays as a plain exercise; so does one `joins` refuses,
 * such as an item the climbing tally runs.
 */
export function runGroupsOf(
  order: readonly number[],
  items: readonly SessionItem[],
  joins: (item: number) => boolean = () => true
): RunGroup[] {
  const groups: RunGroup[] = [];
  order.forEach((key, at) => {
    const g = items[key]?.group;
    if (g === undefined || !joins(key)) return;
    const last = groups[groups.length - 1];
    const before = order[at - 1];
    if (
      last !== undefined &&
      last.id === g.id &&
      before !== undefined &&
      last.members.at(-1) === before
    )
      last.members.push(key);
    else
      groups.push({
        id: g.id,
        restBetweenS: g.restBetweenS,
        restRoundS: g.restRoundS,
        members: [key],
      });
  });
  return groups.filter((g) => g.members.length > 1);
}

type RestStart = { at: string; seconds: number; next: number | null };

/**
 * The rest after a superset's set is ticked: between members while its round has sets to go,
 * after the round while the superset has rounds to go, else before the next exercise. A rest of
 * none is no rest at all.
 */
export function restAfterGroupTick(
  items: readonly SessionItem[],
  ticked: ReadonlySet<string>,
  at: SetAt,
  group: RunGroup,
  exerciseRestS: number
): RestStart | null {
  const has = (item: number): boolean => at.set < (items[item]?.dose.sets ?? 0);
  const rest = (seconds: number): RestStart | null =>
    seconds > 0 ? { at: setKey(at), seconds, next: null } : null;
  if (group.members.some((m) => has(m) && !ticked.has(setKey({ item: m, set: at.set }))))
    return rest(group.restBetweenS);
  if (group.members.some((m) => !itemDone(items, ticked, m))) return rest(group.restRoundS);
  const last = group.members[group.members.length - 1] ?? at.item;
  const next = items.findIndex(
    (_, i) => i > last && !group.members.includes(i) && !itemDone(items, ticked, i)
  );
  return next === -1
    ? null
    : { at: afterKey(last), seconds: restAfterItem(items, last, exerciseRestS), next };
}

/** Each member's log with the superset it ran in and the rounds it ran, so history keeps it. */
export function withRunGroups(done: readonly ItemDone[], groups: readonly RunGroup[]): ItemDone[] {
  return done.map((d) => {
    const g = groups.find((x) => x.members.includes(d.item));
    if (g === undefined) return d;
    const rounds = Math.max(
      ...done.filter((x) => g.members.includes(x.item)).map((x) => x.sets.length)
    );
    return { ...d, group: { id: g.id, rounds } };
  });
}

/** "Superset · Round 2 of 3", over a superset being run. */
export const supersetRoundTitle = (round: number, rounds: number): string =>
  t("workouts.supersetRound", { n: round, total: rounds });

/** "Dips + Rows": a superset's members, joined as the locale joins them. */
export const supersetMembers = (names: readonly string[]): string =>
  names.reduce((first, next) => t("workouts.memberJoin", { first, next }));

/** "Superset · 3 rounds", over its members in a review, a log or a workout's body. */
export const supersetRoundsTitle = (rounds: number): string =>
  t("workouts.supersetRounds", { count: rounds });

/** "B1": a member's letter and the round of its set. */
export const memberSetLabel = (member: number, set: number): string =>
  `${letterOf(member)}${set + 1}`;

const setsOf = (items: readonly SessionItem[], item: number): number => items[item]?.dose.sets ?? 0;

/** The round on now: the first with a set not ticked, counted from 1; the last once all are. */
export function roundOn(
  items: readonly SessionItem[],
  ticked: ReadonlySet<string>,
  group: RunGroup
): number {
  const rounds = Math.max(...group.members.map((m) => setsOf(items, m)));
  const open = Array.from({ length: rounds }, (_, set) => set).find((set) =>
    group.members.some((m) => set < setsOf(items, m) && !ticked.has(setKey({ item: m, set })))
  );
  return (open ?? rounds - 1) + 1;
}

/**
 * Over the first member of each superset in a log: "Superset · 3 rounds"; null elsewhere, and
 * for a member logged alone, as one whose partners' sets all went is no superset.
 */
export const supersetHeadAt = (
  done: readonly Pick<ItemDone, "group">[],
  at: number
): string | null => {
  const g = done[at]?.group;
  if (g === undefined || done[at - 1]?.group?.id === g.id) return null;
  return done[at + 1]?.group?.id === g.id ? supersetRoundsTitle(g.rounds) : null;
};

/**
 * The rest to come under a superset's row: between members within a round, the round's rest
 * after its last member while rounds remain; null for none, a rest of none included.
 */
export function restPreviewAfter(
  group: RunGroup,
  setsOf: (member: number) => number,
  member: number,
  set: number
): number | null {
  const rounds = Math.max(...group.members.map(setsOf));
  const lastInRound = group.members.slice(member + 1).every((m) => set >= setsOf(m));
  const seconds = lastInRound ? (set < rounds - 1 ? group.restRoundS : 0) : group.restBetweenS;
  return seconds > 0 ? seconds : null;
}
