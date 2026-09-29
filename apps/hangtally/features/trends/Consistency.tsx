import React from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { TREND_WEEKS, weeklyCounts } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { Label } from "../../components/Label";
import { useTheme } from "../../theme/ThemeContext";
import { useHangData } from "../data/HangDataContext";

const HEIGHT = 70;
const BAR = 14;
const CAP = 3;

/** Sessions per week for the last sixteen weeks, bar height capped at three. */
export function Consistency(): React.ReactElement {
  const c = useTheme();
  const { model, today } = useHangData();
  const [width, setWidth] = React.useState(0);
  const weeks = weeklyCounts(model.sessions, today);
  const step = (width - BAR) / (TREND_WEEKS - 1);
  const x = (i: number): number => BAR / 2 + i * step;
  const active = weeks
    .map((n, i) => (n > 0 ? `M${x(i)} ${HEIGHT}V${HEIGHT - Math.min(n, CAP) * 20}` : ""))
    .join("");
  const empty = weeks.map((n, i) => (n > 0 ? "" : `M${x(i)} ${HEIGHT}V${HEIGHT - 4}`)).join("");

  return (
    <View style={{ gap: 10, paddingTop: 6 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Label color={c.onDark3}>{t("hang.consistency")}</Label>
        <Label color={c.accent}>
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
            <Path d={empty} stroke={c.lineDark} strokeWidth={BAR} fill="none" />
            <Path d={active} stroke={c.accent} strokeWidth={BAR} fill="none" />
          </Svg>
        )}
      </View>
    </View>
  );
}
