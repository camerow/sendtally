export const weekGap = (count: number): number => (count > 12 ? 1 : 6);

/** The centre of week `i` of `count` columns spread over `width`, gaps between them. */
export function weekCentre(i: number, count: number, width: number): number {
  const gap = weekGap(count);
  const column = (width - gap * (count - 1)) / count;
  return i * (column + gap) + column / 2;
}
