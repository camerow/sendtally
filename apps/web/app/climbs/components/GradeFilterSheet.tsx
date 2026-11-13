import React from "react";
import type { ClimbSummary, GradeScales } from "@sendtally/api-client";
import {
  climbGradeBins,
  gradeFilterOf,
  gradeRangeOf,
  type GradeFilter,
} from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import { disciplineLabel, disciplineOf } from "@sendtally/features/log-session";
import { gradeTap, presetsOf, type GradeRange } from "@sendtally/features/trends";
import { FilterChip } from "../../components/FilterChip";
import { Segmented } from "../../components/Segmented";
import { Sheet } from "../../components/Sheet";
import { GradeHistogram } from "./GradeHistogram";

export type GradeFilterSheetProps = {
  open: boolean;
  value: GradeFilter | null;
  scales: GradeScales;
  climbs: readonly ClimbSummary[];
  onChange: (filter: GradeFilter | null) => void;
  onClose: () => void;
};

const same = (a: GradeRange | null, b: GradeRange | null): boolean =>
  a?.lo === b?.lo && a?.hi === b?.hi;

/** Boulder or route, then the climber's climbs per grade: click one grade, then another for a range. */
export function GradeFilterSheet({
  open,
  value,
  scales,
  climbs,
  onChange,
  onClose,
}: GradeFilterSheetProps): React.ReactElement {
  const [discipline, setDiscipline] = React.useState(
    value === null ? "boulder" : disciplineOf(value.scale)
  );
  const [anchor, setAnchor] = React.useState<number | null>(null);
  const close = (): void => {
    setAnchor(null);
    onClose();
  };
  const scale = value?.scale ?? scales[discipline];
  const bins = climbGradeBins(climbs, scale);
  const range = value === null ? null : gradeRangeOf(value);
  const pick = (grade: GradeRange | null): void =>
    onChange(grade === null ? null : gradeFilterOf(scale, grade));
  const anchorLabel = bins.find((b) => b.rank === anchor)?.label;

  return (
    <Sheet open={open} title={t("common.grade")} onClose={close}>
      <Segmented
        label={t("climbs.discipline")}
        options={(["boulder", "route"] as const).map((d) => ({
          value: d,
          label: disciplineLabel(d),
        }))}
        value={discipline}
        onChange={(d) => {
          setDiscipline(d);
          if (d === discipline) return;
          setAnchor(null);
          onChange(null);
        }}
      />
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
      <div className="sheet-footer">
        <button type="button" className="sheet-action" onClick={close}>
          {t("common.done")}
        </button>
      </div>
    </Sheet>
  );
}
