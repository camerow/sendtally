import React from "react";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { Label } from "../components/Label";

/** Marks a workout as the user's own. */
export function MineBadge(): React.ReactElement {
  return (
    <Label
      small
      color={colors.gunmetal}
      style={{
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 5,
        overflow: "hidden",
        backgroundColor: colors.gold,
      }}
    >
      {t("workouts.mine")}
    </Label>
  );
}
