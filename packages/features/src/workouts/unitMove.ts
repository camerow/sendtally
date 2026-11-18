/**
 * An order with a unit (one key, or a superset's keys together) one place up or down: past the
 * whole of the unit beside it, so a superset is never split. The same order when it cannot move.
 */
export function unitMovedOrder(
  order: readonly number[],
  members: readonly number[],
  by: -1 | 1,
  unitOf: (key: number) => readonly number[]
): readonly number[] {
  const from = order.indexOf(members[0] ?? -1);
  const to = order.indexOf(members[members.length - 1] ?? -1);
  if (from === -1 || to === -1) return order;
  const beside = order[by === -1 ? from - 1 : to + 1];
  if (beside === undefined) return order;
  const other = unitOf(beside);
  const start = by === -1 ? order.indexOf(other[0] ?? beside) : from;
  const end = by === -1 ? to : order.indexOf(other[other.length - 1] ?? beside);
  const middle = by === -1 ? [...members, ...other] : [...other, ...members];
  return [...order.slice(0, start), ...middle, ...order.slice(end + 1)];
}
