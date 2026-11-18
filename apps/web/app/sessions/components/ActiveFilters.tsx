import React from "react";
import type { LogPill } from "@sendtally/features/journal";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";

/** × drops one filter; Clear all shows once there are two. */
export function ActiveFilters({
  pills,
  onDrop,
  onClearAll,
}: {
  pills: readonly LogPill[];
  onDrop: (pill: LogPill) => void;
  onClearAll: () => void;
}): React.ReactElement | null {
  if (pills.length === 0) return null;
  return (
    <div className="active-filters chip-row">
      {pills.map((pill) => (
        <button
          key={pill.key}
          type="button"
          className="active-filter"
          aria-label={`${pill.label}, ${t("common.clear")}`}
          onClick={() => onDrop(pill)}
        >
          <span className="active-filter-label">{pill.label}</span>
          <Icon name="x" size={14} />
        </button>
      ))}
      {pills.length > 1 && (
        <button type="button" className="filter-clear active-filters-clear" onClick={onClearAll}>
          {t("common.clearAll")}
        </button>
      )}
    </div>
  );
}
