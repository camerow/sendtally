import React from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors } from "@sendtally/design/tokens";
import { TREND_WEEKS, weeklyCounts } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { Label } from "../components/Label";
import { useHangData } from "../data/HangDataContext";

const HEIGHT = 40;
const BAR = 12;
const CAP = 3;

/** Sessions per week for the last sixteen weeks, bar height capped at three. */
export function Consistency(): React.ReactElement {
  const { model, today } = useHangData();
  const [width, setWidth] = React.useState(0);
  const weeks = weeklyCounts(model.sessions, today);
  const step = (width - BAR) / (TREND_WEEKS - 1);
  const x = (i: number): number => BAR / 2 + i * step;
  const active = weeks
    .map((n, i) => (n > 0 ? `M${x(i)} ${HEIGHT}V${HEIGHT - Math.min(n, CAP) * 13}` : ""))
    .join("");
  const empty = weeks.map((n, i) => (n > 0 ? "" : `M${x(i)} ${HEIGHT}V${HEIGHT - 3}`)).join("");

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Label color={colors.gunmetal}>{t("hang.consistency")}</Label>
        <Label color={colors.textSecondary}>
          {t("hang.weeksActive", { n: weeks.filter((n) => n > 0).length })}
        </Label>
      </View>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height: HEIGHT }}>
        {width > 0 && (
          <Svg
            width={width}
            height={HEIGHT}
            accessible
            accessibilityLabel={t("hang.consistencyAria")}
          >
            <Path d={empty} stroke="rgba(64,63,76,0.16)" strokeWidth={BAR} fill="none" />
            <Path d={active} stroke={colors.petalInk} strokeWidth={BAR} fill="none" />
          </Svg>
        )}
      </View>
    </View>
  );
}
