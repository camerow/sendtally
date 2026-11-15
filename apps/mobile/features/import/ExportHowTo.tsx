import React from "react";
import { Linking, Text, View } from "react-native";
import { exportPageUrl, IMPORT_SERVICES } from "@sendtally/core/import";
import { colors } from "@sendtally/design/tokens";
import {
  exportLinkLabel,
  exportSteps,
  stepsText,
  type ImportSource,
} from "@sendtally/features/import";
import { t } from "@sendtally/features/i18n";
import { firstRunSourceLabel } from "@sendtally/features/settings";
import { bodyText } from "../../lib/styles";
import { Button } from "../training/components/Button";
import { Description } from "../training/components/Description";
import { Label } from "../training/components/Label";
import { Title } from "../training/components/Title";
import { ConvertCard } from "./ConvertCard";

/** How to get the file out of the source first run picked, with a link to its site. */
export function ExportHowTo({ source }: { source: ImportSource }): React.ReactElement {
  if (source === "spreadsheet")
    return (
      <View style={{ gap: 16 }}>
        <View style={{ gap: 4 }}>
          <Label color={colors.azureInk}>{firstRunSourceLabel(source)}</Label>
          <Title size={34}>{t("import.howToSpreadsheetTitle")}</Title>
        </View>
        <Description
          text={stepsText([t("import.howToSpreadsheet1"), t("import.howToSpreadsheet2")])}
        />
        <ConvertCard />
      </View>
    );
  const name = IMPORT_SERVICES[source];
  const url = exportPageUrl(source);
  const steps = exportSteps(source);
  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 4 }}>
        <Label color={colors.azureInk}>{name}</Label>
        <Title size={34}>{t("import.howToTitle")}</Title>
        {steps.length > 0 && (
          <Text style={{ ...bodyText, fontSize: 14, lineHeight: 21 }}>
            {t("import.howToComputer")}
          </Text>
        )}
      </View>
      {steps.length > 0 && <Description text={stepsText(steps)} />}
      <View style={{ flexDirection: "row" }}>
        <Button
          variant="link"
          label={exportLinkLabel(source, url, name)}
          onPress={() => void Linking.openURL(url)}
        />
      </View>
    </View>
  );
}
