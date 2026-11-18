import React from "react";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
import type { Tally } from "@sendtally/features/log-session";
import { GradeChips } from "../../../components/GradeChips";
import { Button } from "../components/Button";
import { Segmented } from "../components/Segmented";

/** Under the set being climbed: Boulder, Route or Circuit, its grades, then Attempt or Sent. */
export function GradePicker({ tally }: { tally: Tally }): React.ReactElement {
  return (
    <View style={{ gap: 8, paddingTop: 2, paddingBottom: 6 }}>
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
        active={tally.active}
        startIndex={tally.startIndex}
        light
        inset={0}
        onPick={tally.pick}
      />
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Button
            label={t("tally.attempt")}
            onPress={() => tally.go("fell")}
            disabled={tally.active === null}
            variant="outline"
            height={44}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label={t("common.sent")}
            onPress={() => tally.go("sent")}
            disabled={tally.active === null}
            variant="primary"
            height={44}
          />
        </View>
      </View>
    </View>
  );
}
