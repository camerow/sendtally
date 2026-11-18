import React from "react";
import type { ScopeItem } from "@sendtally/features/sessions";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";

/** Whether the field is open is the bar's own; the text is the filter's. */
export type ScopeSearch = {
  open: boolean;
  text: string;
  onOpen: () => void;
  onChangeText: (text: string) => void;
  onCancel: () => void;
};

function SearchField({ search }: { search: ScopeSearch }): React.ReactElement {
  return (
    <div className="scope-bar scope-bar--search">
      <label className="scope-search">
        <Icon name="search" size={16} strokeWidth={2} />
        <input
          type="search"
          value={search.text}
          onChange={(e) => search.onChangeText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") search.onCancel();
          }}
          placeholder={t("sessions.searchLog")}
          aria-label={t("sessions.searchLog")}
          autoComplete="off"
          spellCheck={false}
          autoFocus
        />
      </label>
      <button type="button" className="scope-cancel" onClick={search.onCancel}>
        {t("common.cancel")}
      </button>
    </div>
  );
}

export function ScopeBar({
  items,
  currentKey,
  onSelect,
  filtersActive,
  onOpenFilters,
  search,
}: {
  items: readonly ScopeItem[];
  currentKey: string | null;
  onSelect: (sectionKey: string) => void;
  filtersActive: boolean;
  onOpenFilters: () => void;
  search: ScopeSearch;
}): React.ReactElement {
  const strip = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (currentKey === null || strip.current === null) return;
    const chip = strip.current.querySelector<HTMLElement>(`[data-section="${currentKey}"]`);
    if (chip !== null) strip.current.scrollLeft = Math.max(0, chip.offsetLeft - 80);
  }, [currentKey]);
  if (search.open) return <SearchField search={search} />;
  return (
    <div className="scope-bar">
      <div ref={strip} className="scope-strip chip-row">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            data-section={item.sectionKey}
            className={item.kind === "year" ? "scope-chip scope-chip--year" : "scope-chip"}
            aria-pressed={item.sectionKey === currentKey && item.kind !== "year"}
            aria-label={t("sessions.jumpToLabel", { label: item.label })}
            onClick={() => onSelect(item.sectionKey)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="scope-filter"
        aria-label={t("sessions.searchLog")}
        onClick={search.onOpen}
      >
        <Icon name="search" size={16} strokeWidth={2} />
      </button>
      <button
        type="button"
        className={filtersActive ? "scope-filter scope-filter--on" : "scope-filter"}
        aria-label={t("common.filters")}
        aria-pressed={filtersActive}
        onClick={onOpenFilters}
      >
        <Icon name="funnel" size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
