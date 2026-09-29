import React from "react";
import { View } from "react-native";
import Svg, { Path, Polyline } from "react-native-svg";
import { t } from "@sendtally/features/i18n";
import { Label } from "../../components/Label";
import { useTheme } from "../../theme/ThemeContext";
import { dots, plot, polyline } from "./chartGeometry";

const HEIGHT = 44;
const NEUTRAL_RPE = 6;

/** A small effort line under the load chart; sessions without effort sit at 6. */
export function EffortLine({ rpes }: { rpes: readonly (number | null)[] }): React.ReactElement {
  const c = useTheme();
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
        paddingHorizontal: 4,
        borderTopWidth: 1,
        borderTopColor: c.lineLight,
      }}
    >
      <Label small color={c.ink2}>
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
              stroke={c.rest}
              strokeWidth={2}
              strokeLinejoin="round"
            />
            <Path
              d={dots(points)}
              stroke={c.rest}
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
