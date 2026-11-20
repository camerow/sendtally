import React from "react";
import { t } from "@sendtally/features/i18n";
import type { Tally } from "@sendtally/features/log-session";
import { GradeChips } from "../../components/GradeChips";
import { Segmented } from "../../components/Segmented";

/**
 * Under the set being climbed: Boulder, Route or Circuit, and its grades; a grade adds a climb,
 * clicked as a chip or picked from the keyboard in the select beside the switch.
 */
export function GradePicker({ tally }: { tally: Tally }): React.ReactElement {
  return (
    <div className="climb-picker">
      <div className="climb-picker-top">
        {tally.segments.length > 1 && (
          <span className="climb-picker-segments" style={{ width: tally.segments.length * 96 }}>
            <Segmented
              soft
              label={t("climbs.discipline")}
              options={tally.segments.map((s) => ({ value: s, label: tally.segmentLabel(s) }))}
              value={tally.segment}
              onChange={tally.pickSegment}
            />
          </span>
        )}
        <select
          className="form-input climb-grade-select"
          aria-label={t("common.grade")}
          value=""
          onChange={(e) => {
            if (e.target.value !== "") tally.add(e.target.value);
          }}
        >
          <option value="" disabled>
            {t("common.grade")}
          </option>
          {tally.chips.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <GradeChips
        label={t("common.grade")}
        chips={tally.chips}
        active={null}
        startIndex={tally.startIndex}
        onPick={tally.add}
      />
    </div>
  );
}
