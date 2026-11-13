import React from "react";
import type { ScopeItem } from "@sendtally/features/sessions";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";

/** The months to jump to, the one in view lit, and the filter button at the end. */
export function ScopeBar({
  items,
  currentKey,
  onSelect,
  filtersActive,
  onOpenFilters,
}: {
  items: readonly ScopeItem[];
  currentKey: string | null;
  onSelect: (sectionKey: string) => void;
  filtersActive: boolean;
  onOpenFilters: () => void;
}): React.ReactElement {
  const strip = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (currentKey === null || strip.current === null) return;
    const chip = strip.current.querySelector<HTMLElement>(`[data-section="${currentKey}"]`);
    if (chip !== null) strip.current.scrollLeft = Math.max(0, chip.offsetLeft - 80);
  }, [currentKey]);
  return (
    <div className="scope-bar">
      <div ref={strip} className="scope-strip">
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
