import React from "react";
import { View } from "react-native";
import type { Tally } from "@sendtally/features/log-session";
import { GradeChips } from "../../../components/GradeChips";
import { Segmented } from "../components/Segmented";

/** Under the set being climbed: Boulder, Route or Circuit, and its grades; a grade adds a climb. */
export function GradePicker({ tally }: { tally: Tally }): React.ReactElement {
  return (
    <View style={{ gap: 8, paddingTop: 6, paddingBottom: 2 }}>
      {tally.segments.length > 1 && (
        <View style={{ width: tally.segments.length * 96 }}>
          <Segmented
            options={tally.segments.map((s) => ({ value: s, label: tally.segmentLabel(s) }))}
            value={tally.segment}
            onChange={tally.pickSegment}
            height={32}
          />
        </View>
      )}
      <GradeChips
        chips={tally.chips}
        active={null}
        startIndex={tally.startIndex}
        light
        inset={0}
        onPick={tally.add}
      />
    </View>
  );
}
