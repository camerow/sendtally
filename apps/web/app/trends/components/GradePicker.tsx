import React from "react";
import { t } from "@sendtally/features/i18n";
import { gradeTap, type GradeRange, type TrendsVM } from "@sendtally/features/trends";

const BAR_MAX = 84;

/** Tap one grade for just that grade, a second to close a range. */
export function GradePicker({
  vm,
  grade,
  onChange,
  onDone,
}: {
  vm: TrendsVM;
  grade: GradeRange | null;
  onChange: (grade: GradeRange | null) => void;
  onDone?: () => void;
}): React.ReactElement {
  const [anchor, setAnchor] = React.useState<number | null>(null);
  const max = Math.max(1, ...vm.grades.map((b) => b.count));
  const within = (rank: number): boolean =>
    grade === null || (rank >= grade.lo && rank <= grade.hi);
  const count = vm.grades.filter((b) => within(b.rank)).reduce((a, b) => a + b.count, 0);
  const anchorLabel = vm.grades.find((b) => b.rank === anchor)?.label;
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 12,
        }}
      >
        <span className="trend-popover-title">{vm.gradeLabel ?? t("trends.anyGrade")}</span>
        <span className="trend-small-label" style={{ fontSize: 11 }}>
          {t("common.climbCount", { count })} · {vm.rangeLabel}
        </span>
      </div>
      <p className="trend-popover-help">
        {anchorLabel === undefined
          ? t("trends.gradeHelp")
          : t("trends.gradeHelpAnchor", { grade: anchorLabel })}
      </p>
      <div className="trend-hist">
        {vm.grades.map((b) => {
          const on = grade !== null && within(b.rank);
          return (
            <button
              key={b.rank}
              type="button"
              className="trend-hist-bin"
              data-in={within(b.rank)}
              data-anchor={anchor === b.rank}
              aria-pressed={on}
              aria-label={t("trends.gradeBin", {
                grade: b.label,
                climbs: t("common.climbCount", { count: b.count }),
              })}
              onClick={() => {
                const next = gradeTap(anchor, b.rank);
                setAnchor(next.anchor);
                onChange(next.grade);
              }}
            >
              <span className="trend-small-label" style={{ fontSize: 9 }}>
                {b.count === 0 ? "" : b.count}
              </span>
              <span
                className="trend-hist-bar"
                style={{
                  height: b.count === 0 ? 2 : Math.max(3, Math.round((b.count / max) * BAR_MAX)),
                }}
              />
            </button>
          );
        })}
      </div>
      <div className="trend-hist-axis">
        {vm.grades.map((b) => (
          <span key={b.rank} data-in={grade !== null && within(b.rank)}>
            {b.label}
          </span>
        ))}
      </div>
      <div className="trend-popover-foot">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {vm.presets.map((p) => (
            <button
              key={p.key}
              type="button"
              className="trend-preset"
              onClick={() => {
                setAnchor(null);
                onChange(p.grade);
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        {onDone !== undefined && (
          <button type="button" className="trend-done" onClick={onDone}>
            {t("common.done")}
          </button>
        )}
      </div>
    </div>
  );
}
