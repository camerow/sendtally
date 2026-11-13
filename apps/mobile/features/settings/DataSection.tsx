import React from "react";
import { Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { colors } from "@sendtally/design/tokens";
import { bodyText, messageText, sectionCard, sectionLabel } from "../../lib/styles";
import { Button } from "../training/components/Button";
import type { CsvExportFeature } from "./useCsvExport";

const onCard = { flex: 1, backgroundColor: colors.white };

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
        <Button
          variant="outline"
          label={t("settings.importCsv")}
          onPress={onImport}
          style={onCard}
        />
        <Button
          variant="outline"
          label={t("settings.exportCsv")}
          onPress={exporter.exportCsv}
          disabled={exporter.busy}
          style={onCard}
        />
      </View>
      {exporter.message !== null && <Text style={messageText}>{exporter.message}</Text>}
    </View>
  );
}
