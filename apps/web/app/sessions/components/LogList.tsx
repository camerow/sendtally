import React from "react";
import type { ClimbingSessionVM } from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import type { LogView } from "@sendtally/features/journal";
import {
  logCountLabel,
  logYearGroups,
  monthKeyScopeItems,
  monthScopeItems,
  type ScopeItem,
} from "@sendtally/features/sessions";
import { LogCell } from "./LogCell";
import { ScopeBar, type ScopeSearch } from "./ScopeBar";
import { SectionHeader, sectionId } from "./SectionHeader";
import type { LogRow } from "./types";

/** `meta` is null on the per-climb list, whose groups are labelled lightly or not at all. */
type Section = { key: string; title: string | null; meta: string | null; rows: LogRow[] };

const NO_CLIMBS: ReadonlyMap<string, ClimbingSessionVM> = new Map();

function sectionsOf(view: LogView): { sections: Section[]; scope: ScopeItem[] } {
  if (view.kind === "climbs") {
    const sections = view.log.groups.map((g) => ({
      key: g.key,
      title: g.label,
      meta: null,
      rows: g.rows.map((row): LogRow => ({ type: "climb", key: `climb:${row.id}`, row })),
    }));
    return {
      sections,
      scope: monthKeyScopeItems(sections.map((s) => s.key).filter((k) => k !== "pinned")),
    };
  }
  const years = logYearGroups(view.items);
  return {
    sections: years.flatMap((year) =>
      year.months.map((m) => ({
        key: m.key,
        title: m.name,
        meta: t("sessions.monthMeta", { year: m.year, sessions: logCountLabel(m.items) }),
        rows: m.items,
      }))
    ),
    scope: monthScopeItems(years),
  };
}

/** The month whose header last scrolled under the top of the window. */
function useCurrentSection(keys: readonly string[]): string | null {
  const [current, setCurrent] = React.useState<string | null>(null);
  React.useEffect(() => {
    const update = (): void => {
      let at: string | null = keys[0] ?? null;
      for (const key of keys) {
        const top = document.getElementById(sectionId(key))?.getBoundingClientRect().top;
        if (top !== undefined && top <= 80) at = key;
      }
      setCurrent(at);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [keys]);
  return current ?? keys.find((k) => k !== "pinned") ?? null;
}

export function LogList({
  view,
  below,
  empty,
  filtersActive,
  onOpenFilters,
  search,
}: {
  view: LogView;
  below: React.ReactNode;
  empty: React.ReactNode;
  filtersActive: boolean;
  onOpenFilters: () => void;
  search: ScopeSearch;
}): React.ReactElement {
  const { sections, scope } = React.useMemo(() => sectionsOf(view), [view]);
  const nested = view.kind === "dated" ? view.climbing : NO_CLIMBS;
  const keys = React.useMemo(() => sections.map((s) => s.key), [sections]);
  const current = useCurrentSection(keys);

  return (
    <div className="log-list">
      <ScopeBar
        items={scope}
        currentKey={current}
        onSelect={(key) =>
          document.getElementById(sectionId(key))?.scrollIntoView({ block: "start" })
        }
        filtersActive={filtersActive}
        onOpenFilters={onOpenFilters}
        search={search}
      />
      {below}
      {sections.map((section) => (
        <section key={section.key}>
          {section.meta !== null && section.title !== null ? (
            <SectionHeader sectionKey={section.key} title={section.title} meta={section.meta} />
          ) : (
            section.title !== null && (
              <h2 id={sectionId(section.key)} className="climbing-group-label">
                {section.title}
              </h2>
            )
          )}
          {section.rows.map((row) => (
            <LogCell key={row.key} item={row} nested={nested} />
          ))}
        </section>
      ))}
      {sections.length === 0 && empty}
    </div>
  );
}
