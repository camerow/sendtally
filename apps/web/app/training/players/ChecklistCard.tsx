import React from "react";
import type { SessionItem } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import type { MoreMenuItem } from "../../components/MoreMenu";
import { ChecklistRow } from "./ChecklistRow";
import { ExerciseCardHead } from "./ExerciseCardHead";

export type ChecklistCardProps = {
  item: SessionItem;
  lines: readonly string[];
  ticked: (line: number) => boolean;
  onToggle: (line: number) => void;
  onFold: () => void;
  menu: readonly MoreMenuItem[];
};

/** A checklist among the exercise cards: its typed lines, ticked in any order. */
export function ChecklistCard({
  item,
  lines,
  ticked,
  onToggle,
  onFold,
  menu,
}: ChecklistCardProps): React.ReactElement {
  return (
    <section className="player-card">
      <ExerciseCardHead
        item={{ ...item, exercise: t("workouts.checklist") }}
        onFold={onFold}
        menu={menu}
      />
      <div className="check-list">
        {lines.map((line, i) => (
          <ChecklistRow key={i} name={line} ticked={ticked(i)} onToggle={() => onToggle(i)} />
        ))}
      </div>
    </section>
  );
}
