import React from "react";
import { t } from "@sendtally/features/i18n";
import type { GradePickerModel } from "@sendtally/features/workouts";
import { ComboField } from "../../components/ComboField";
import { GradeChips } from "../../components/GradeChips";
import { Segmented } from "../../components/Segmented";

/**
 * Under the set being climbed: Boulder, Route or Circuit, and its grades; a grade adds a climb,
 * clicked as a chip or typed and picked in the grade field beside the switch.
 */
export function GradePicker({ tally }: { tally: GradePickerModel }): React.ReactElement {
  const [typed, setTyped] = React.useState("");
  const query = typed.trim().toLowerCase();
  const items = tally.chips
    .filter((c) => c.label.toLowerCase().startsWith(query))
    .map((c) => ({
      key: c.key,
      label: c.label,
      onPick: () => {
        setTyped("");
        tally.add(c.key);
      },
    }));
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
        <span className="climb-grade-field">
          <ComboField
            value={typed}
            items={items}
            ariaLabel={t("common.grade")}
            placeholder={t("common.grade")}
            className="form-input climb-grade-input"
            inputStyle={{}}
            onChange={setTyped}
          />
        </span>
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
