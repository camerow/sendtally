import React from "react";
import { t } from "@sendtally/features/i18n";
import type { MoreMenuItem } from "../../components/MoreMenu";
import { ExerciseBlock } from "./ExerciseBlock";
import { ExerciseHead } from "./ExerciseHead";
import { SetRow } from "./SetRow";

export type ChecklistCardProps = {
  lines: readonly string[];
  ticked: (line: number) => boolean;
  /** Ticks a line; none on the finished workout, which only reads them. */
  onToggle?: (line: number) => void;
  /** In the run: its title folds it. */
  onFold?: () => void;
  /** In the run: its ··· menu. */
  menu?: readonly MoreMenuItem[];
};

/** A typed checklist in the run, the review and the finished workout: a row per line, its name and its tick. */
export function ChecklistCard({
  lines,
  ticked,
  onToggle,
  onFold,
  menu,
}: ChecklistCardProps): React.ReactElement {
  return (
    <ExerciseBlock
      head={
        <ExerciseHead
          name={t("workouts.checklist")}
          {...(onFold !== undefined && { onFold })}
          {...(menu !== undefined && { menu })}
        />
      }
    >
      {lines.map((line, i) => (
        <SetRow
          key={i}
          position=""
          label={line}
          ticked={ticked(i)}
          {...(onToggle !== undefined && { onToggle: () => onToggle(i) })}
        >
          <span className="checklist-line">{line}</span>
        </SetRow>
      ))}
    </ExerciseBlock>
  );
}
