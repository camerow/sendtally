import React from "react";
import { View } from "react-native";
import { colors, effortColor } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { Label } from "./Label";

export type EffortMarkProps = { rpe: number };

/** A logged session's effort in a list: a dot in its effort colour and the RPE beside it. */
export function EffortMark({ rpe }: EffortMarkProps): React.ReactElement {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: effortColor(rpe) }} />
      <Label small color={colors.gunmetal}>
        {t("hang.rpeValue", { value: rpe })}
      </Label>
    </View>
  );
}
