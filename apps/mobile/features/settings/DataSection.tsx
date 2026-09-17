import React from "react";
import { Pressable, Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { press } from "../../lib/press";
import { bodyText, messageText, sectionCard, sectionLabel } from "../../lib/styles";
import type { CsvExportFeature } from "./useCsvExport";

export function DataSection({ exporter }: { exporter: CsvExportFeature }): React.ReactElement {
  return (
    <View style={sectionCard}>
      <Text style={sectionLabel}>{t("settings.yourData")}</Text>
      <Text style={bodyText}>{t("settings.exportBodyMobile")}</Text>
      <Pressable
        onPress={exporter.exportCsv}
        disabled={exporter.busy}
        accessibilityRole="button"
        style={press({
          minHeight: 46,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radius.control,
          borderWidth: 1,
          borderColor: colors.lineOnLightStrong,
          backgroundColor: colors.white,
          opacity: exporter.busy ? 0.55 : 1,
        })}
      >
        <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.gunmetal }}>
          {t("settings.exportCsv")}
        </Text>
      </Pressable>
      {exporter.message !== null && <Text style={messageText}>{exporter.message}</Text>}
    </View>
  );
}
