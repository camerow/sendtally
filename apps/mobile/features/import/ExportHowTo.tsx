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

function Head({
  kicker,
  title,
  heading,
}: {
  kicker: string;
  title: string;
  heading: React.ReactNode;
}): React.ReactElement {
  if (heading !== undefined)
    return (
      <>
        {heading}
        <Label color={colors.gunmetal}>{title}</Label>
      </>
    );
  return (
    <View style={{ gap: 4 }}>
      <Label color={colors.azureInk}>{kicker}</Label>
      <Title size={34}>{title}</Title>
    </View>
  );
}

/**
 * How to get the file out of the source first run picked, with a link to its site. Given a
 * heading, that stands above and the steps' own title becomes their section label.
 */
export function ExportHowTo({
  source,
  heading,
}: {
  source: ImportSource;
  heading?: React.ReactNode;
}): React.ReactElement {
  if (source === "spreadsheet")
    return (
      <View style={{ gap: 16 }}>
        <Head
          kicker={firstRunSourceLabel(source)}
          title={t("import.howToSpreadsheetTitle")}
          heading={heading}
        />
        <Description
          text={stepsText([
            t("import.howToSpreadsheet1"),
            t("import.howToSpreadsheet2"),
            t("import.howToSpreadsheet3"),
          ])}
        />
        <Text style={{ ...bodyText, fontSize: 12.5, lineHeight: 18 }}>
          {t("import.howToSpreadsheetAi")}
        </Text>
      </View>
    );
  const url = exportPageUrl(source);
  const steps = exportSteps(source);
  const computer = steps.length > 0 && (
    <Text style={{ ...bodyText, fontSize: 14, lineHeight: 21 }}>{t("import.howToComputer")}</Text>
  );
  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: heading === undefined ? 4 : 16 }}>
        <Head kicker={IMPORT_SERVICES[source]} title={t("import.howToTitle")} heading={heading} />
        {heading === undefined && computer}
      </View>
      {steps.length > 0 && <Description text={stepsText(steps)} />}
      <View style={{ flexDirection: "row" }}>
        <Button
          variant="link"
          label={exportLinkLabel(source)}
          onPress={() => void Linking.openURL(url)}
          style={{ paddingHorizontal: 0 }}
        />
      </View>
      {heading !== undefined && computer}
    </View>
  );
}
