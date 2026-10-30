import React from "react";
import { Alert, Text, View } from "react-native";
import type { WeightUnit } from "@sendtally/core/hang";
import { useHang, useHangActions } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Segmented } from "../../components/Segmented";
import { useApi } from "../../lib/api";
import { bodyText, sectionCard, sectionLabel } from "../../lib/styles";

const UNITS: readonly WeightUnit[] = ["lb", "kg"];

const reportFailure = (): void => Alert.alert(t("hang.saveFailed"));

/** The one place the weight unit is chosen; every load and lift shows in it. */
export function WeightUnitSection(): React.ReactElement {
  const api = useApi();
  const hang = useHang(api).state;
  const actions = useHangActions(api, reportFailure);
  const current = hang.status === "ready" ? hang.data.settings.units : null;
  return (
    <View style={sectionCard}>
      <View style={{ gap: 6 }}>
        <Text style={sectionLabel}>{t("settings.weightUnit")}</Text>
        <Text style={bodyText}>{t("settings.weightUnitBody")}</Text>
      </View>
      <Segmented
        label={t("settings.weightUnit")}
        segments={UNITS.map((u) => ({
          key: u,
          label: u,
          on: u === current,
          onPress: () => void actions.saveSettings({ units: u }),
        }))}
      />
    </View>
  );
}
