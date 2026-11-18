import React from "react";
import { Text, View } from "react-native";
import type { ItemDone } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { checklistTitle } from "@sendtally/features/workouts";
import { ChecklistRow } from "../checklist/ChecklistRow";
import { type } from "../type";

export type ChecklistReviewProps = {
  list: NonNullable<ItemDone["checklist"]>;
  /** The kind's colour, on its mark. */
  color: string;
  onToggle: (line: number) => void;
};

/** A checklist in the review: "Checklist · 4 of 5" over its lines, a tap ticking one. */
export function ChecklistReview({
  list,
  color,
  onToggle,
}: ChecklistReviewProps): React.ReactElement {
  return (
    <View
      style={{
        gap: 4,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingBottom: 4 }}>
        <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
        <Text style={[type.bodyBold, { flex: 1, fontSize: 17, color: colors.gunmetal }]}>
          {checklistTitle(list.checked.length, list.lines.length)}
        </Text>
      </View>
      {list.lines.map((line, i) => (
        <ChecklistRow
          key={i}
          name={line}
          ticked={list.checked.includes(i)}
          last={i === list.lines.length - 1}
          onToggle={() => onToggle(i)}
        />
      ))}
    </View>
  );
}
