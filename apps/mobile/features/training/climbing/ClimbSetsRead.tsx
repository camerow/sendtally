import React from "react";
import { Text, View } from "react-native";
import type { SetDone } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { wallTimeText } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { type } from "../type";
import { Label } from "../components/Label";
import { ClimbReadRow } from "./ClimbReadRow";

export type ClimbSetsReadProps = { sets: readonly SetDone[] };

/** A climbing exercise's sets as done: each set's climbs as read rows, grade then how it went, and a time set's time on its line. */
export function ClimbSetsRead({ sets }: ClimbSetsReadProps): React.ReactElement {
  return (
    <>
      {sets.map((set, s) => (
        <View key={s}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              justifyContent: "space-between",
              paddingTop: s === 0 ? 2 : 8,
            }}
          >
            <Label small color={colors.textSecondary}>
              {t("tally.setLabel", { set: s + 1 })}
            </Label>
            {set.onS !== undefined && (
              <Text style={[type.mono, { fontSize: 13, color: colors.textSecondary }]}>
                {wallTimeText(set.onS)}
              </Text>
            )}
          </View>
          {(set.climbs ?? []).map((climb, c) => (
            <ClimbReadRow key={c} position={c + 1} climb={climb} />
          ))}
        </View>
      ))}
    </>
  );
}
