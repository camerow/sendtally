import React from "react";
import type { ClimbSummary } from "@sendtally/api-client";
import {
  climbGradeBins,
  gradeFilterOf,
  gradeRangeOf,
  type GradeFilter,
} from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import type { GradeScale } from "@sendtally/features/log-session";
import { gradeTap, presetsOf, type GradeRange } from "@sendtally/features/trends";
import { FilterChip } from "../../components/FilterChip";
import { GradeHistogram } from "./GradeHistogram";

export type GradePickerProps = {
  scale: GradeScale;
  value: GradeFilter | null;
  climbs: readonly ClimbSummary[];
  onChange: (filter: GradeFilter | null) => void;
};

const same = (a: GradeRange | null, b: GradeRange | null): boolean =>
  a?.lo === b?.lo && a?.hi === b?.hi;

/** Click one grade, then another for a range; presets below. */
export function GradePicker({
  scale,
  value,
  climbs,
  onChange,
}: GradePickerProps): React.ReactElement {
  const [anchor, setAnchor] = React.useState<number | null>(null);
  const bins = climbGradeBins(climbs, scale);
  const range = value === null ? null : gradeRangeOf(value);
  const pick = (grade: GradeRange | null): void =>
    onChange(grade === null ? null : gradeFilterOf(scale, grade));
  const anchorLabel = bins.find((b) => b.rank === anchor)?.label;

  return (
    <>
      {bins.length > 0 && (
        <>
          <p className="sheet-body">
            {anchorLabel === undefined
              ? t("trends.gradeHelp")
              : t("trends.gradeHelpAnchor", { grade: anchorLabel })}
          </p>
          <GradeHistogram
            bins={bins}
            range={range}
            onTap={(rank) => {
              const next = gradeTap(anchor, rank);
              setAnchor(next.anchor);
              pick(next.grade);
            }}
          />
        </>
      )}
      <div className="grade-presets">
        {presetsOf(bins).map((p) => (
          <FilterChip
            key={p.key}
            label={p.label}
            active={same(p.grade, range)}
            onPress={() => {
              setAnchor(null);
              pick(p.grade);
            }}
          />
        ))}
      </div>
    </>
  );
}
