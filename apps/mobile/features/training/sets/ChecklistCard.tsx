import React from "react";
import { Text } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { DetailMenuRow } from "../components/types";
import { type } from "../type";
import { ExerciseBlock } from "./ExerciseBlock";
import { ExerciseHead } from "./ExerciseHead";
import { SetRow } from "./SetRow";

export type ChecklistCardProps = {
  lines: readonly string[];
  ticked: (line: number) => boolean;
  onToggle: (line: number) => void;
  /** In the run: its title folds it. */
  onFold?: () => void;
  /** In the run: its ··· menu. */
  menu?: readonly DetailMenuRow[];
};

/** A typed checklist in the run and the review: a row per line, its name and its tick. */
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
        <SetRow key={i} position="" label={line} ticked={ticked(i)} onToggle={() => onToggle(i)}>
          <Text style={[type.bodyBold, { flex: 1, fontSize: 15, color: colors.gunmetal }]}>
            {line}
          </Text>
        </SetRow>
      ))}
    </ExerciseBlock>
  );
}
