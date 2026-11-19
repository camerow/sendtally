import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { ChecklistRow } from "../checklist/ChecklistRow";
import type { DetailMenuRow } from "../components/types";
import { ExerciseHead } from "./ExerciseHead";

export type ChecklistCardProps = {
  lines: readonly string[];
  ticked: (line: number) => boolean;
  onToggle: (line: number) => void;
  onFold: () => void;
  menu: readonly DetailMenuRow[];
};

/** A checklist among the exercise cards: its typed lines, ticked in any order. */
export function ChecklistCard({
  lines,
  ticked,
  onToggle,
  onFold,
  menu,
}: ChecklistCardProps): React.ReactElement {
  return (
    <View
      style={{
        gap: 4,
        padding: 14,
        paddingTop: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
      }}
    >
      <ExerciseHead name={t("workouts.checklist")} onFold={onFold} menu={menu} />
      {lines.map((line, i) => (
        <ChecklistRow
          key={i}
          name={line}
          ticked={ticked(i)}
          last={i === lines.length - 1}
          onToggle={() => onToggle(i)}
        />
      ))}
    </View>
  );
}
