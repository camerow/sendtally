import type { SessionTag } from "@sendtally/api-client";
import { MONTH_SHORT_NAMES } from "./months";
import type { SessionTagGroup } from "./tags";
import type { SessionYear } from "./years";

export type ScopeItem = {
  key: string;
  label: string;
  sectionKey: string;
  kind: "year" | "month" | "tag";
};

export function monthScopeItems(years: SessionYear[]): ScopeItem[] {
  return years.flatMap((year): ScopeItem[] => {
    const first = year.months[0];
    if (first === undefined) return [];
    return [
      { key: `year-${year.year}`, label: year.label, sectionKey: first.key, kind: "year" },
      ...year.months.map((month): ScopeItem => ({
        key: month.key,
        label: MONTH_SHORT_NAMES[month.month - 1] ?? "",
        sectionKey: month.key,
        kind: "month",
      })),
    ];
  });
}

export function tagScopeItems<T extends { tags: SessionTag[] }>(
  groups: Array<SessionTagGroup<T>>
): ScopeItem[] {
  return groups.map((group) => ({
    key: group.key,
    label: group.label.toUpperCase(),
    sectionKey: group.key,
    kind: "tag",
  }));
}
