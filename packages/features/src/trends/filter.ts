import { t } from "../i18n";
import type { GradeBinVM, GradePresetVM, GradeRange, TrendFilter } from "./types";

export function withTag(filter: TrendFilter, slug: string): TrendFilter {
  const tags = filter.tags.includes(slug)
    ? filter.tags.filter((s) => s !== slug)
    : [...filter.tags, slug];
  return { ...filter, tags };
}

export function isRefined(filter: TrendFilter): boolean {
  return (
    (filter.grade !== null && filter.scope !== "all") ||
    filter.setting !== "all" ||
    (filter.gymId !== null && filter.scope !== "circuit") ||
    filter.tags.length > 0
  );
}

/** One tap is a single grade; a second closes the range between the two. */
export function gradeTap(
  anchor: number | null,
  rank: number
): { grade: GradeRange; anchor: number | null } {
  if (anchor === null) return { grade: { lo: rank, hi: rank }, anchor: rank };
  return { grade: { lo: Math.min(anchor, rank), hi: Math.max(anchor, rank) }, anchor: null };
}

/** Every rank from the lowest climbed to the highest, the empty ones too, so the bars line up. */
export function gradeBins(
  counts: ReadonlyMap<number, number>,
  label: (rank: number) => string
): GradeBinVM[] {
  if (counts.size === 0) return [];
  const ranks = [...counts.keys()];
  const out: GradeBinVM[] = [];
  for (let rank = Math.min(...ranks); rank <= Math.max(...ranks); rank++) {
    out.push({ rank, label: label(rank), count: counts.get(rank) ?? 0 });
  }
  return out;
}

/** Any grade, the top three grades climbed, and everything up to a grade below those. */
export function presetsOf(bins: readonly GradeBinVM[]): GradePresetVM[] {
  const label = (rank: number): string => bins.find((b) => b.rank === rank)?.label ?? "";
  const present = bins.filter((b) => b.count > 0);
  const low = present[0]?.rank;
  const top = present[present.length - 1]?.rank;
  const any: GradePresetVM = { key: "any", label: t("trends.anyGrade"), grade: null };
  if (low === undefined || top === undefined) return [any];
  const limit = Math.max(low, top - 2);
  const volume = Math.max(low, top - 3);
  return [
    any,
    {
      key: "limit",
      label: t("trends.presetLimit", { grade: label(limit) }),
      grade: { lo: limit, hi: top },
    },
    {
      key: "volume",
      label: t("trends.presetVolume", { grade: label(volume) }),
      grade: { lo: low, hi: volume },
    },
  ];
}
