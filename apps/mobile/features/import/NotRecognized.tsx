import React from "react";
import { Share, Text, View } from "react-native";
import { CONVERSION_PROMPT } from "@sendtally/features/import";
import { t } from "@sendtally/features/i18n";
import { colors } from "@sendtally/design/tokens";
import { bodyText, sectionCard, sectionLabel } from "../../lib/styles";
import { Button } from "../training/components/Button";
import { AMBER } from "../training/components/tints";
import { ImportHero } from "./ImportHero";

/** A file with nothing usable in it, and the prompt that converts a spreadsheet into one. */
export function NotRecognized({ fileName }: { fileName: string }): React.ReactElement {
  return (
    <>
      <ImportHero
        kicker={t("import.notRecognized")}
        kickerColor={AMBER}
        title={t("import.nothingToImport")}
        meta={fileName}
      />
      <Text style={{ ...bodyText, fontSize: 14, lineHeight: 21 }}>
        {t("import.nothingFoundMobile")}
      </Text>
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
    </>
  );
}
