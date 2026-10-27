import React from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { colors } from "@sendtally/design/tokens";
import { CIRCUIT_HEX } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import type { TopSendVM } from "@sendtally/features/statistics";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { paddedRange } from "../trends/chartGeometry";
import { type } from "../type";
import { weekCentre } from "./weekColumns";

const HEIGHT = 90;
const PAD = 7;

const card = {
  gap: 12,
  padding: 16,
  borderRadius: 18,
  borderWidth: 1,
  borderColor: colors.lineOnLight,
} as const;

function Chart({ vm }: { vm: TopSendVM }): React.ReactElement {
  const [width, setWidth] = React.useState(0);
  const sent = vm.weeks.flatMap((w, i) => (w === null ? [] : [{ ...w, i }]));
  const [lo, hi] = paddedRange(
    sent.map((s) => s.rank),
    0.5
  );
  const points = sent.map((s) => ({
    x: weekCentre(s.i, vm.weeks.length, width),
    y: PAD + (HEIGHT - PAD * 2) * (1 - (s.rank - lo) / (hi - lo || 1)),
    circuit: s.circuit,
  }));
  const step = points.map((p, i) => (i === 0 ? `M${p.x} ${p.y}` : `H${p.x} V${p.y}`)).join("");
  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height: HEIGHT }}>
      {width > 0 && (
        <Svg width={width} height={HEIGHT} accessible accessibilityLabel={t("statistics.topSend")}>
          <Path d={step} fill="none" stroke={colors.azure} strokeWidth={2} strokeLinejoin="round" />
          {points.map((p) => (
            <Circle
              key={p.x}
              cx={p.x}
              cy={p.y}
              r={5}
              fill={p.circuit === null ? colors.azure : CIRCUIT_HEX[p.circuit]}
              stroke={p.circuit === "white" ? colors.lineOnLightStrong : colors.white}
              strokeWidth={2}
            />
          ))}
        </Svg>
      )}
    </View>
  );
}

/** The hardest indoor send each week as one line; members only for now. */
export function TopGymSend({
  vm,
  locked,
  onLocked,
}: {
  vm: TopSendVM;
  locked: boolean;
  onLocked: () => void;
}): React.ReactElement {
  if (locked) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("common.membersOnly", { label: t("statistics.topSend") })}
        onPress={onLocked}
        style={{ ...card, borderStyle: "dashed" }}
      >
        <Label color={colors.gunmetal}>{t("statistics.topSend")}</Label>
        <Text style={[type.body, { fontSize: 14, color: colors.textSecondary }]}>
          {t("statistics.topSendLocked")}
        </Text>
      </Pressable>
    );
  }
  return (
    <View style={card}>
      <Label color={colors.gunmetal}>{t("statistics.topSend")}</Label>
      {vm.now === null ? (
        <Text style={[type.body, { fontSize: 14, color: colors.textSecondary }]}>
          {t("statistics.noTopSend")}
        </Text>
      ) : (
        <>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10 }}>
            <Title size={40}>{vm.now}</Title>
            {vm.from !== null && (
              <Text style={[type.body, { fontSize: 14, color: colors.textSecondary }]}>
                {vm.from}
              </Text>
            )}
          </View>
          <Chart vm={vm} />
        </>
      )}
    </View>
  );
}
