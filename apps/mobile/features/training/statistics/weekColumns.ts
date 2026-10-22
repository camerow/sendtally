export const WEEK_GAP = 6;

/** The centre of week `i` of `count` columns spread over `width`, gaps between them. */
export function weekCentre(i: number, count: number, width: number): number {
  const column = (width - WEEK_GAP * (count - 1)) / count;
  return i * (column + WEEK_GAP) + column / 2;
}
