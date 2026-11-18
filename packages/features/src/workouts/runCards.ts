import { unitMovedOrder } from "./unitMove";
import type { ItemDone, SessionItem, SetDone } from "@sendtally/core/hang";
import { setKeyOf } from "../activities/done";
import type { SetAt } from "./setsRun";

/**
 * The cards of a run as they stand: each keyed by its place in the workout, an exercise added
 * during the run keyed past the `base` exercises the workout had when it started, in the order
 * the climber has them now. `ended` is the order exercises were finished in; `shut` and `open`
 * are cards folded or opened by hand.
 */
export type RunCards = {
  base: number;
  order: number[];
  added: SessionItem[];
  skipped: number[];
  ended: number[];
  shut: number[];
  open: number[];
};

export const cardsOf = (count: number): RunCards => ({
  base: count,
  order: Array.from({ length: count }, (_, i) => i),
  added: [],
  skipped: [],
  ended: [],
  shut: [],
  open: [],
});

/** A draft saved before a field existed gets it as a new run would have it. */
export const cardsFrom = (stored: Partial<RunCards> | undefined, count: number): RunCards => ({
  ...cardsOf(count),
  ...stored,
});

const without = (keys: number[], key: number): number[] => keys.filter((k) => k !== key);

export function withCardMoved(cards: RunCards, key: number, by: -1 | 1): RunCards {
  const from = cards.order.indexOf(key);
  const to = from + by;
  if (from === -1 || to < 0 || to >= cards.order.length) return cards;
  const order = [...cards.order];
  [order[from], order[to]] = [order[to] ?? key, key];
  return { ...cards, order };
}

/** A card, or a superset's cards together, one place up or down (see `unitMovedOrder`). */
export function withUnitMoved(
  cards: RunCards,
  members: readonly number[],
  by: -1 | 1,
  unitOf: (key: number) => readonly number[]
): RunCards {
  const order = unitMovedOrder(cards.order, members, by, unitOf);
  return order === cards.order ? cards : { ...cards, order: [...order] };
}

/** Skipped for now: to the end, where it stays once it is done after all. */
export const withCardSkipped = (cards: RunCards, key: number): RunCards => ({
  ...cards,
  order: [...without(cards.order, key), key],
  skipped: [...without(cards.skipped, key), key],
});

export const withCardRemoved = (cards: RunCards, key: number): RunCards => ({
  ...cards,
  order: without(cards.order, key),
  skipped: without(cards.skipped, key),
});

export const withCardAdded = (cards: RunCards, item: SessionItem): RunCards => ({
  ...cards,
  order: [...cards.order, cards.base + cards.added.length],
  added: [...cards.added, item],
});

/** Folded or opened by hand, or null to go back to folding when it is done. */
export const withCardFold = (cards: RunCards, key: number, fold: boolean | null): RunCards => ({
  ...cards,
  shut: fold === true ? [...without(cards.shut, key), key] : without(cards.shut, key),
  open: fold === false ? [...without(cards.open, key), key] : without(cards.open, key),
});

/** A card whose last set was just ticked ends now; one unticked again has not ended. */
export const withCardEnded = (cards: RunCards, key: number, ended: boolean): RunCards =>
  ended === cards.ended.includes(key)
    ? cards
    : { ...cards, ended: ended ? [...cards.ended, key] : without(cards.ended, key) };

/** A set taken out of a card: the sets after it move up, their ticks with them. */
export function withoutSet(
  done: readonly ItemDone[],
  ticked: ReadonlySet<string>,
  { item, set }: SetAt
): { done: ItemDone[]; ticked: Set<string> } {
  const sets = done.find((d) => d.item === item)?.sets.length ?? 0;
  const next = new Set([...ticked].filter((k) => !k.startsWith(`${item}:`)));
  for (let s = 0; s < sets; s++)
    if (s !== set && ticked.has(setKeyOf(item, s))) next.add(setKeyOf(item, s < set ? s : s - 1));
  return {
    done: done.map((d) =>
      d.item === item ? { ...d, sets: d.sets.filter((_, i) => i !== set) } : d
    ),
    ticked: next,
  };
}

/** Undo of `withoutSet`: the set back in its place with its tick, over whatever changed since. */
export function withSetBack(
  done: readonly ItemDone[],
  ticked: ReadonlySet<string>,
  { item, set }: SetAt,
  value: SetDone,
  wasTicked: boolean
): { done: ItemDone[]; ticked: Set<string> } {
  const next = new Set(
    [...ticked].map((k) => {
      const [i, s] = k.split(":").map(Number);
      return i === item && s !== undefined && s >= set ? setKeyOf(item, s + 1) : k;
    })
  );
  if (wasTicked) next.add(setKeyOf(item, set));
  return {
    done: done.map((d) =>
      d.item === item ? { ...d, sets: [...d.sets.slice(0, set), value, ...d.sets.slice(set)] } : d
    ),
    ticked: next,
  };
}

/**
 * What a run logs, numbered from there, and the sets left unticked: the cards as they stand,
 * with the exercises that ended taking their places in the order they ended, and the rest,
 * which never ended (a climbing one among them), left where they are.
 */
export function finishedInOrder(
  cards: RunCards,
  done: readonly ItemDone[],
  ticked: ReadonlySet<string>
): { done: ItemDone[]; off: string[] } {
  const ended = cards.ended.filter((key) => cards.order.includes(key));
  let next = 0;
  const keys = cards.order.map((key) => (ended.includes(key) ? (ended[next++] ?? key) : key));
  const kept = keys.flatMap((key) => done.filter((d) => d.item === key));
  return {
    done: kept.map((d, item) => ({ ...d, item })),
    off: kept.flatMap((d, item) =>
      d.sets.flatMap((_, s) => (ticked.has(setKeyOf(d.item, s)) ? [] : [setKeyOf(item, s)]))
    ),
  };
}
