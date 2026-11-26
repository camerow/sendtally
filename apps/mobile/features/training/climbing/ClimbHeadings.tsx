import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { Label } from "../components/Label";
import { SET_COLUMNS } from "../sets/setColumns";

/** Grade, Attempts and Sent over a climbing exercise's first rows, once a card. */
export function ClimbHeadings(): React.ReactElement {
  return (
    <View style={[SET_COLUMNS.row, { minHeight: 20 }]}>
      <View style={SET_COLUMNS.position} />
      <Label small color={colors.textSecondary} style={{ width: 60 }}>
        {t("common.grade")}
      </Label>
      <Label small color={colors.textSecondary} style={{ flex: 1, textAlign: "center" }}>
        {t("climbs.attempts")}
      </Label>
      <Label
        small
        color={colors.textSecondary}
        style={{ width: SET_COLUMNS.tick.width, textAlign: "right" }}
      >
        {t("common.sent")}
      </Label>
    </View>
  );
}
