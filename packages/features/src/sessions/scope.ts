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
  return monthKeyScopeItems(years.flatMap((year) => year.months.map((month) => month.key)));
}

/** A year chip then its months, for month keys ("2026-11") newest first. */
export function monthKeyScopeItems(keys: readonly string[]): ScopeItem[] {
  return keys.flatMap((key, i): ScopeItem[] => {
    const month: ScopeItem = {
      key,
      label: monthShortName(Number(key.slice(5, 7))),
      sectionKey: key,
      kind: "month",
    };
    const year = key.slice(0, 4);
    if (keys[i - 1]?.slice(0, 4) === year) return [month];
    return [{ key: `year-${year}`, label: year, sectionKey: key, kind: "year" }, month];
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
