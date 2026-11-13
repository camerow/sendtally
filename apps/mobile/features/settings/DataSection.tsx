import React from "react";
import { Pressable, Text, View, type ViewStyle } from "react-native";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { press } from "../../lib/press";
import { bodyText, messageText, sectionCard, sectionLabel } from "../../lib/styles";
import type { CsvExportFeature } from "./useCsvExport";

const outlineButton: ViewStyle = {
  flex: 1,
  minHeight: 46,
  alignItems: "center",
  justifyContent: "center",
  borderRadius: radius.control,
  borderWidth: 1,
  borderColor: colors.lineOnLightStrong,
  backgroundColor: colors.white,
};

const outlineLabel = { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.gunmetal };

export function DataSection({
  exporter,
  onImport,
}: {
  exporter: CsvExportFeature;
  onImport: () => void;
}): React.ReactElement {
  return (
    <View style={sectionCard}>
      <Text style={sectionLabel}>{t("settings.yourData")}</Text>
      <Text style={bodyText}>{t("settings.yourDataBody")}</Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable onPress={onImport} accessibilityRole="button" style={press(outlineButton)}>
          <Text style={outlineLabel}>{t("settings.importCsv")}</Text>
        </Pressable>
        <Pressable
          onPress={exporter.exportCsv}
          disabled={exporter.busy}
          accessibilityRole="button"
          style={press({ ...outlineButton, opacity: exporter.busy ? 0.55 : 1 })}
        >
          <Text style={outlineLabel}>{t("settings.exportCsv")}</Text>
        </Pressable>
      </View>
      {exporter.message !== null && <Text style={messageText}>{exporter.message}</Text>}
    </View>
  );
}
