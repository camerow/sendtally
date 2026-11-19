import React from "react";
import { View } from "react-native";
import type { SetDone } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { Label } from "../components/Label";
import { ClimbReadRow } from "./ClimbReadRow";

export type ClimbSetsReadProps = { sets: readonly SetDone[] };

/** A climbing exercise's sets as done: each set's climbs as read rows, grade then how it went. */
export function ClimbSetsRead({ sets }: ClimbSetsReadProps): React.ReactElement {
  return (
    <>
      {sets.map((set, s) => (
        <View key={s}>
          <Label small color={colors.textSecondary} style={{ paddingTop: s === 0 ? 2 : 8 }}>
            {t("tally.setLabel", { set: s + 1 })}
          </Label>
          {(set.climbs ?? []).map((climb, c) => (
            <ClimbReadRow key={c} position={c + 1} climb={climb} />
          ))}
        </View>
      ))}
    </>
  );
}
