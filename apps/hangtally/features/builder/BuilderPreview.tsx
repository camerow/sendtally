import React from "react";
import { Text, View } from "react-native";
import { totalSeconds, type Protocol, type TimeUnits } from "@sendtally/core/hang";
import { humanDuration, protocolSummary } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Label } from "../../components/Label";
import { PhaseBar } from "../../components/PhaseBar";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";

export function BuilderPreview({
  protocol,
  units,
}: {
  protocol: Protocol;
  units: TimeUnits;
}): React.ReactElement {
  const c = useTheme();
  return (
    <View style={{ gap: 10, padding: 16, borderRadius: 16, backgroundColor: c.deep }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Label color={c.onDark3}>{t("hang.preview")}</Label>
        <Label color={c.accent}>{humanDuration(totalSeconds(protocol))}</Label>
      </View>
      <View style={{ flexDirection: "row" }}>
        <PhaseBar protocol={protocol} height={22} />
      </View>
      <Text style={[type.mono, { fontSize: 13, color: c.onDark2 }]}>
        {protocolSummary(protocol, units)}
      </Text>
    </View>
  );
}
