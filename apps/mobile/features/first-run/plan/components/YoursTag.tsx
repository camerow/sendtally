import React from "react";
import { Text } from "react-native";
import { colors, radius } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { type } from "../../../training/type";

/** Marks an exercise or workout the user made, not one from the library. */
export function YoursTag(): React.ReactElement {
  return (
    <Text
      style={[
        type.monoBold,
        {
          fontSize: 10,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: radius.sm,
          overflow: "hidden",
          color: colors.gunmetal,
          backgroundColor: colors.gold,
        },
      ]}
    >
      {t("onboarding.plan.yours")}
    </Text>
  );
}
