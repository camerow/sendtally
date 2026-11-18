import React from "react";
import { t } from "@sendtally/features/i18n";
import type { Tally } from "@sendtally/features/log-session";
import { GradeChips } from "../../components/GradeChips";
import { Segmented } from "../../components/Segmented";

/** Under the set being climbed: Boulder, Route or Circuit, its grades (or one typed), then Attempt or Sent. */
export function GradePicker({ tally }: { tally: Tally }): React.ReactElement {
  const [typed, setTyped] = React.useState("");
  const pickTyped = (): void => {
    const match = tally.chips.find((c) => c.label.toLowerCase() === typed.trim().toLowerCase());
    if (match === undefined) return;
    tally.pick(match.key);
    setTyped("");
  };
  return (
    <div className="climb-picker">
      <div className="climb-picker-top">
        {tally.segments.length > 1 && (
          <Segmented
            soft
            label={t("climbs.discipline")}
            options={tally.segments.map((s) => ({ value: s, label: tally.segmentLabel(s) }))}
            value={tally.segment}
            onChange={tally.pickSegment}
          />
        )}
        <input
          className="form-input climb-type"
          aria-label={t("common.grade")}
          placeholder={tally.chips[tally.startIndex]?.label ?? ""}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            pickTyped();
          }}
        />
      </div>
      <GradeChips
        label={t("common.grade")}
        chips={tally.chips}
        active={tally.active}
        startIndex={tally.startIndex}
        onPick={tally.pick}
      />
      <div className="climb-goes">
        <button
          type="button"
          className="outline-button"
          disabled={tally.active === null}
          onClick={() => tally.go("fell")}
        >
          {t("tally.attempt")}
        </button>
        <button
          type="button"
          className="detail-primary"
          disabled={tally.active === null}
          onClick={() => tally.go("sent")}
        >
          {t("common.sent")}
        </button>
      </div>
    </div>
  );
}
