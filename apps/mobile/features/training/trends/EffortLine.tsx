import React from "react";
import { View } from "react-native";
import Svg, { Path, Polyline } from "react-native-svg";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { Label } from "../components/Label";
import { dots, plot, polyline } from "./chartGeometry";

const HEIGHT = 44;
const NEUTRAL_RPE = 6;

/** A small effort line under the load chart; sessions without effort sit at 6. */
export function EffortLine({ rpes }: { rpes: readonly (number | null)[] }): React.ReactElement {
  const [width, setWidth] = React.useState(0);
  const points = plot(
    rpes.map((r) => r ?? NEUTRAL_RPE),
    1,
    10,
    width,
    HEIGHT,
    5
  );
  return (
    <View
      style={{
        gap: 6,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: colors.lineOnLight,
      }}
    >
      <Label small color={colors.textSecondary}>
        {t("hang.effortRpe")}
      </Label>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height: HEIGHT }}>
        {width > 0 && (
          <Svg
            width={width}
            height={HEIGHT}
            accessible
            accessibilityLabel={t("hang.effortPerSession")}
          >
            <Polyline
              points={polyline(points)}
              fill="none"
              stroke={colors.petal}
              strokeWidth={2}
              strokeLinejoin="round"
            />
            <Path
              d={dots(points)}
              stroke={colors.petal}
              strokeWidth={6}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        )}
      </View>
    </View>
  );
}
