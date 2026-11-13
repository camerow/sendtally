import React from "react";
import { Pressable, Share, Text, View } from "react-native";
import { CONVERSION_PROMPT } from "@sendtally/features/import";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { press } from "../../lib/press";
import { bodyText, sectionCard, sectionLabel } from "../../lib/styles";
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
          <Pressable
            onPress={() => void Share.share({ message: CONVERSION_PROMPT })}
            accessibilityRole="button"
            style={press({
              minHeight: 46,
              paddingHorizontal: 18,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radius.control,
              borderWidth: 1,
              borderColor: colors.lineOnLightStrong,
              backgroundColor: colors.white,
            })}
          >
            <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.gunmetal }}>
              {t("import.sharePrompt")}
            </Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}
