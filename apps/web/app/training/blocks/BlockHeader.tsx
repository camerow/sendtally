import React from "react";
import { isDated, type Block, type CalendarDate } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import {
  blockDateRange,
  blockName,
  canStepWeeks,
  clampWeeks,
  keptName,
} from "@sendtally/features/training";
import { BlockWeekChips } from "./BlockWeekChips";

export type BlockHeaderProps = {
  block: Block;
  today: CalendarDate;
  /** Its name, length and first day as fields; plain text while reading. */
  editing: boolean;
  /** The name it has saved, which a scheduled block keeps when the field is emptied. */
  savedName: string;
  /** Opens with the name being typed, as a new block does. */
  autoFocus: boolean;
  week: number;
  onPickWeek: (week: number) => void;
  /** The block as typed or stepped. */
  onSave: (block: Block) => void;
  /** The fewest weeks it can step down to: a running block keeps the weeks it has run. */
  minWeeks?: number;
  /** Opens the calendar to move its first day; none once it has started. */
  onMoveStart?: () => void;
};

/**
 * A block's head: its name, its dates, and its weeks to pick from. In Edit mode the name is
 * typed, the weeks stepped, and a scheduled block's dates move until it starts.
 */
export function BlockHeader({
  block,
  today,
  editing,
  savedName,
  autoFocus,
  week,
  onPickWeek,
  onSave,
  minWeeks = 1,
  onMoveStart,
}: BlockHeaderProps): React.ReactElement {
  const dated = isDated(block) ? block : null;
  const [name, setName] = React.useState(block.name);
  const kept = (typed: string): string => keptName(typed, block, savedName);
  const weeks = (n: number): void => {
    const next = clampWeeks(n, minWeeks);
    if (next !== block.weeks) onSave({ ...block, weeks: next });
    if (week > next) onPickWeek(next);
  };
  const step = (glyph: string, label: string, by: number): React.ReactElement => (
    <button
      type="button"
      className="weeks-step"
      aria-label={label}
      disabled={!canStepWeeks(block, by, minWeeks)}
      onClick={() => weeks(block.weeks + by)}
    >
      {glyph}
    </button>
  );
  const when = (
    <span className="block-when">
      {dated === null ? t("plan.notScheduled") : blockDateRange(dated)}
    </span>
  );
  const chips = <BlockWeekChips block={block} today={today} picked={week} onPick={onPickWeek} />;

  if (!editing)
    return (
      <>
        <div className="block-head">
          <span className="train-label">
            {dated === null ? t("plan.template") : t("plan.scheduled")}
          </span>
          <h1 className="block-title">{blockName(block)}</h1>
          {when}
        </div>
        {chips}
      </>
    );

  return (
    <>
      <div className="block-head">
        <span className="train-label form-mode">{t("plan.editBlock")}</span>
        <input
          className="name-field block-name-field"
          aria-label={t("hang.name")}
          value={name}
          maxLength={80}
          placeholder={t("plan.blockNamePlaceholder")}
          autoComplete="off"
          {...(autoFocus && { autoFocus: true })}
          onChange={(e) => {
            setName(e.target.value);
            onSave({ ...block, name: kept(e.target.value.trim()) });
          }}
          onBlur={() => setName(kept(name.trim()))}
        />
      </div>
      <div className="block-edit-row">
        {onMoveStart === undefined ? (
          when
        ) : (
          <button
            type="button"
            className="block-move"
            aria-label={t("plan.moveStart")}
            onClick={onMoveStart}
          >
            {when}
            <span className="block-move-link">{t("plan.move")}</span>
          </button>
        )}
        <span className="weeks-stepper">
          {step("−", t("hang.decrease", { field: t("plan.weeks") }), -1)}
          <span className="weeks-count">{t("calendar.weeks", { count: block.weeks })}</span>
          {step("+", t("hang.increase", { field: t("plan.weeks") }), 1)}
        </span>
      </div>
      {chips}
    </>
  );
}
