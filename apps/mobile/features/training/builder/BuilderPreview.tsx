import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { totalSeconds, type Protocol, type TimeUnits } from "@sendtally/core/hang";
import { humanDuration, protocolSummary } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Label } from "../components/Label";
import { PhaseBar } from "../components/PhaseBar";
import { type } from "../type";

export function BuilderPreview({
  protocol,
  units,
}: {
  protocol: Protocol;
  units: TimeUnits;
}): React.ReactElement {
  return (
    <View style={{ gap: 10, padding: 16, borderRadius: 16, backgroundColor: colors.surfaceSoft }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Label color={colors.textSecondary}>{t("hang.preview")}</Label>
        <Label color={colors.gunmetal}>{humanDuration(totalSeconds(protocol))}</Label>
      </View>
      <View style={{ flexDirection: "row" }}>
        <PhaseBar protocol={protocol} height={14} />
      </View>
      <Text style={[type.mono, { fontSize: 13, color: colors.gunmetal }]}>
        {protocolSummary(protocol, units)}
      </Text>
    </View>
  );
}
