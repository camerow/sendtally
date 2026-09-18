import React from "react";
import { createPortal } from "react-dom";
import { t } from "@sendtally/features/i18n";
import {
  resetFilter,
  withPlace,
  withTag,
  type TrendsFeature,
  type TrendsVM,
} from "@sendtally/features/trends";
import { GradePicker } from "./GradePicker";
import { PlacePicker } from "./PlacePicker";
import { TagChecklist } from "./TagChecklist";

/** The phone-width home for grade, place and tags; changes apply live behind it. */
export function RefineSheet({
  feature,
  vm,
  onClose,
}: {
  feature: TrendsFeature;
  vm: TrendsVM;
  onClose: () => void;
}): React.ReactElement {
  const { filter, setFilter } = feature;
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return createPortal(
    <div className="trends">
      <button
        type="button"
        className="trend-sheet-scrim"
        aria-label={t("trends.closeFilter")}
        onClick={onClose}
      />
      <div
        className="trend-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={t("trends.refineTitle")}
      >
        <span className="trend-sheet-grip" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span className="trend-popover-title" style={{ fontSize: 22 }}>
            {t("trends.refineTitle")}
          </span>
          <button type="button" className="trend-link" onClick={() => setFilter(resetFilter)}>
            {t("trends.reset")}
          </button>
        </div>
        {vm.scope !== "all" && vm.grades.length > 0 && (
          <GradePicker
            vm={vm}
            grade={filter.grade}
            onChange={(grade) => setFilter((f) => ({ ...f, grade }))}
          />
        )}
        <div>
          <span className="trend-small-label" style={{ marginBottom: 8 }}>
            {t("trends.place")}
          </span>
          <PlacePicker
            setting={filter.setting}
            gymId={vm.scope === "circuit" ? null : filter.gymId}
            gyms={vm.gyms}
            onChange={(setting, gymId) => setFilter((f) => withPlace(f, setting, gymId))}
          />
        </div>
        {vm.tags.length > 0 && (
          <div>
            <span className="trend-small-label" style={{ marginBottom: 8 }}>
              {t("common.tags")}
            </span>
            <TagChecklist
              tags={vm.tags}
              selected={filter.tags}
              searchable={vm.tags.length > 8}
              onToggle={(slug) => setFilter((f) => withTag(f, slug))}
              onClear={() => setFilter((f) => ({ ...f, tags: [] }))}
            />
          </div>
        )}
        <button type="button" className="trend-sheet-cta" onClick={onClose}>
          {t("trends.showSessions", { count: vm.sessions })}
        </button>
      </div>
    </div>,
    document.body
  );
}
