import React from "react";
import { Share, Text, View } from "react-native";
import { CONVERSION_PROMPT } from "@sendtally/features/import";
import { t } from "@sendtally/features/i18n";
import { colors } from "@sendtally/design/tokens";
import { bodyText, sectionCard, sectionLabel } from "../../lib/styles";
import { Button } from "../training/components/Button";

/** The prompt that converts any spreadsheet into a file Sendtally reads, shared to an AI app. */
export function ConvertCard(): React.ReactElement {
  return (
    <View style={sectionCard}>
      <Text style={sectionLabel}>{t("import.convertTitle")}</Text>
      <Text style={bodyText}>{t("import.convertHelpMobile")}</Text>
      <View style={{ flexDirection: "row" }}>
        <Button
          variant="outline"
          label={t("import.sharePrompt")}
          onPress={() => void Share.share({ message: CONVERSION_PROMPT })}
          style={{ backgroundColor: colors.white }}
        />
      </View>
    </View>
  );
}
