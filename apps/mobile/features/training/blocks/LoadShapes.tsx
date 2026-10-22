import React from "react";
import { View } from "react-native";
import { LOAD_SHAPES, type LoadShape } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { Button } from "../components/Button";
import { Label } from "../components/Label";

function shapeLabel(shape: LoadShape): string {
  switch (shape) {
    case "flat":
      return t("plan.shapeFlat");
    case "ramp":
      return t("plan.shapeRamp");
    case "taper":
      return t("plan.shapeTaper");
    case "wave":
      return t("plan.shapeWave");
  }
}

export type LoadShapesProps = { onPick: (shape: LoadShape) => void };

/** One-tap starting shapes; they only fill the weeks, which stay editable. */
export function LoadShapes({ onPick }: LoadShapesProps): React.ReactElement {
  return (
    <View style={{ gap: 8 }}>
      <Label small color={colors.textSecondary}>
        {t("plan.shapes")}
      </Label>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {LOAD_SHAPES.map((shape) => (
          <Button
            key={shape}
            label={shapeLabel(shape)}
            onPress={() => onPick(shape)}
            variant="outline"
            height={44}
          />
        ))}
      </View>
    </View>
  );
}
