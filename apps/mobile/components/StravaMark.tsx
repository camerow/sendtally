import React from "react";
import Svg, { Path } from "react-native-svg";
import { t } from "@sendtally/features/i18n";

/** The mark a posted session wears beside its name, in place of a second badge. */
export function StravaMark({ size = 12 }: { size?: number }): React.ReactElement {
  return (
    <Svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      accessibilityRole="image"
      accessibilityLabel={t("sessions.onStrava")}
    >
      <Path
        fill="#fc4c02"
        d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"
      />
    </Svg>
  );
}
