import React from "react";
import { Text } from "react-native";
import { t } from "@sendtally/features/i18n";
import { bodyText } from "../../lib/styles";
import { AMBER } from "../training/components/tints";
import { ConvertCard } from "./ConvertCard";
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
      <ConvertCard />
    </>
  );
}
