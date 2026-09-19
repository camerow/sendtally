import { t } from "../i18n";
import { disciplineLabel } from "../log-session/types";
import type {
  GradeRange,
  TrendFilter,
  TrendGymVM,
  TrendScope,
  TrendSetting,
  TrendTagVM,
} from "./types";

/** Grades never convert between scopes, so a new scope starts from any grade. */
export function withScope(
  filter: TrendFilter,
  scope: TrendScope,
  gymId: string | null = null
): TrendFilter {
  if (scope === "circuit") return { ...filter, scope, gymId, setting: "indoor", grade: null };
  const leavingGym = filter.scope === "circuit";
  return {
    ...filter,
    scope,
    grade: null,
    ...(leavingGym ? { gymId: null, setting: "all" as const } : {}),
  };
}

/** A gym is a place inside; picking a setting drops the gym unless it is still inside. */
export function withPlace(
  filter: TrendFilter,
  setting: TrendSetting,
  gymId: string | null
): TrendFilter {
  const place = { setting: gymId === null ? setting : ("indoor" as const), gymId };
  const leavesLadder = filter.scope === "circuit" && gymId !== filter.gymId;
  return {
    ...filter,
    ...(leavesLadder ? { scope: "boulder" as const, grade: null } : {}),
    ...place,
  };
}

export function withTag(filter: TrendFilter, slug: string): TrendFilter {
  const tags = filter.tags.includes(slug)
    ? filter.tags.filter((s) => s !== slug)
    : [...filter.tags, slug];
  return { ...filter, tags };
}

/** Everything but the scope and range; a circuit scope needs its gym, so it goes back to boulder. */
export function resetFilter(filter: TrendFilter): TrendFilter {
  const scope = filter.scope === "circuit" ? "boulder" : filter.scope;
  return { ...filter, scope, grade: null, setting: "all", gymId: null, tags: [] };
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

export function scopeLabel(scope: TrendScope): string {
  if (scope === "all") return t("trends.scopeAll");
  if (scope === "circuit") return t("trends.scopeMore");
  return disciplineLabel(scope);
}

export function settingLabel(setting: TrendSetting): string {
  if (setting === "indoor") return t("trends.inside");
  if (setting === "outdoor") return t("trends.outside");
  return t("trends.everywhere");
}

export function placeLabel(filter: TrendFilter, gyms: TrendGymVM[]): string {
  const gym = filter.gymId === null ? undefined : gyms.find((g) => g.id === filter.gymId);
  return gym?.name ?? settingLabel(filter.setting);
}

export function tagsLabel(filter: TrendFilter, tags: TrendTagVM[]): string {
  if (filter.tags.length === 0) return t("trends.allSessions");
  if (filter.tags.length > 2) return t("trends.tagCount", { count: filter.tags.length });
  return filter.tags.map((slug) => tags.find((g) => g.slug === slug)?.name ?? slug).join(", ");
}

/** The phone collapses grade, place and tags into one line: only what is set, else a prompt. */
export function refineSummary(
  filter: TrendFilter,
  gradeLabel: string | null,
  gyms: TrendGymVM[],
  tags: TrendTagVM[]
): string {
  const parts = [
    gradeLabel,
    filter.setting === "all" && filter.gymId === null ? null : placeLabel(filter, gyms),
    filter.tags.length === 0 ? null : tagsLabel(filter, tags),
  ].filter((p): p is string => p !== null);
  return parts.length === 0 ? t("trends.refineAll") : parts.join(" · ");
}
