import React from "react";
import { t } from "@sendtally/features/i18n";
import {
  PREVIEW_TREND_RANGE,
  TREND_RANGES,
  isRefined,
  placeLabel,
  refineSummary,
  resetFilter,
  tagsLabel,
  withPlace,
  withTag,
  type TrendsFeature,
  type TrendsVM,
} from "@sendtally/features/trends";
import { useIsNarrow } from "../../lib/useIsNarrow";
import { DropButton } from "./DropButton";
import { GradePicker } from "./GradePicker";
import { PlacePicker } from "./PlacePicker";
import { RangeChips } from "./RangeChips";
import { RefineSheet } from "./RefineSheet";
import { TagChecklist } from "./TagChecklist";

export function FilterRow({
  feature,
  vm,
  onLockedRange,
}: {
  feature: TrendsFeature;
  vm: TrendsVM;
  onLockedRange: () => void;
}): React.ReactElement {
  const { filter, setFilter, preview } = feature;
  const narrow = useIsNarrow();
  const [sheet, setSheet] = React.useState(false);
  const all = vm.scope === "all";
  const refined = isRefined(filter);
  const placeActive = filter.setting !== "all" || (filter.gymId !== null && vm.scope !== "circuit");

  return (
    <div className="trend-filter-row">
      <RangeChips
        ranges={TREND_RANGES}
        range={filter.range}
        onChange={(range) => setFilter((f) => ({ ...f, range }))}
        isLocked={(r) => preview && r !== PREVIEW_TREND_RANGE}
        onLocked={onLockedRange}
      />
      {narrow ? (
        <>
          <button
            type="button"
            className="trend-refine"
            data-active={refined}
            aria-haspopup="dialog"
            onClick={() => setSheet(true)}
          >
            <span className="trend-refine-summary">
              {refineSummary(filter, vm.gradeLabel, vm.gyms, vm.tags)}
            </span>
            <span
              className="trend-small-label"
              style={{ fontSize: 11, color: "var(--bs-gunmetal)" }}
            >
              {t("trends.refine")}
            </span>
          </button>
          {sheet && <RefineSheet feature={feature} vm={vm} onClose={() => setSheet(false)} />}
        </>
      ) : (
        <div className="trend-drops">
          {refined && (
            <button type="button" className="trend-link" onClick={() => setFilter(resetFilter)}>
              {t("trends.reset")}
            </button>
          )}
          <DropButton
            label={t("common.grade")}
            value={all ? t("trends.gradeNeedsDiscipline") : (vm.gradeLabel ?? t("trends.anyGrade"))}
            active={!all && vm.gradeLabel !== null}
            disabled={all || vm.grades.length === 0}
            width={520}
          >
            {(close) => (
              <GradePicker
                vm={vm}
                grade={filter.grade}
                onChange={(grade) => setFilter((f) => ({ ...f, grade }))}
                onDone={close}
              />
            )}
          </DropButton>
          <DropButton
            label={t("trends.place")}
            value={placeLabel(filter, vm.gyms)}
            active={placeActive}
            width={340}
          >
            {() => (
              <PlacePicker
                setting={filter.setting}
                gymId={vm.scope === "circuit" ? null : filter.gymId}
                gyms={vm.gyms}
                onChange={(setting, gymId) => setFilter((f) => withPlace(f, setting, gymId))}
              />
            )}
          </DropButton>
          <DropButton
            label={t("common.tags")}
            value={tagsLabel(filter, vm.tags)}
            active={filter.tags.length > 0}
            disabled={vm.tags.length === 0 && filter.tags.length === 0}
            width={320}
          >
            {() => (
              <TagChecklist
                tags={vm.tags}
                selected={filter.tags}
                onToggle={(slug) => setFilter((f) => withTag(f, slug))}
                onClear={() => setFilter((f) => ({ ...f, tags: [] }))}
              />
            )}
          </DropButton>
        </div>
      )}
    </div>
  );
}
