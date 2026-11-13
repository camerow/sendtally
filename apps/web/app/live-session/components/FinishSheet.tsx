import React from "react";
import { effortWord } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Sheet } from "../../components/Sheet";

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/** One question on the way out: effort. Skipping it lets the session rate itself. */
export function FinishSheet({
  open,
  summary,
  onSave,
  onDiscard,
  onClose,
}: {
  open: boolean;
  summary: string;
  onSave: (rpe: number | null) => void;
  onDiscard: () => void;
  onClose: () => void;
}): React.ReactElement {
  const [rpe, setRpe] = React.useState<number | null>(null);
  const hint =
    rpe === null ? t("tally.skipEffort") : `${rpe} · ${effortWord(rpe)}. ${t("tally.skipEffort")}`;
  return (
    <Sheet
      open={open}
      title={t("tally.howHard")}
      onClose={onClose}
      action={{ label: t("common.save"), onPress: () => onSave(rpe) }}
    >
      <span className="finish-summary">{summary}</span>
      <div className="finish-levels" role="radiogroup" aria-label={t("common.effort")}>
        {LEVELS.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rpe === n}
            aria-label={`${n}, ${effortWord(n)}`}
            className="finish-level"
            onClick={() => setRpe((r) => (r === n ? null : n))}
          >
            <span
              className={rpe !== null && n <= rpe ? "finish-bar finish-bar--on" : "finish-bar"}
              style={{ height: n * 4 + 8 }}
            />
            <span className="finish-number">{n}</span>
          </button>
        ))}
      </div>
      <p className="sheet-body">{hint}</p>
      <button type="button" className="finish-discard" onClick={onDiscard}>
        {t("tally.discardSession")}
      </button>
    </Sheet>
  );
}
