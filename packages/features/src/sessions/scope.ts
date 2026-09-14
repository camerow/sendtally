import type { SessionTag } from "@sendtally/api-client";
import { monthShortName } from "./months";
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
        label: monthShortName(month.month),
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
    label: group.label,
    sectionKey: group.key,
    kind: "tag",
  }));
}
