import React from "react";
import { Linking, Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { WEB_URL } from "../../lib/config";
import { bodyText, sectionCard, sectionLabel } from "../../lib/styles";
import { Button } from "../training/components/Button";

const AGENTS = `${WEB_URL}/agents`;

/** Importing through an AI app connected to sendtally, as the web's Agents page sets up. */
export function AssistantCard(): React.ReactElement {
  return (
    <View style={sectionCard}>
      <Text style={sectionLabel}>{t("import.assistantTitle")}</Text>
      <Text style={bodyText}>{t("import.assistantBody")}</Text>
      <View style={{ flexDirection: "row" }}>
        <Button
          variant="link"
          label={AGENTS.replace("https://", "")}
          onPress={() => void Linking.openURL(AGENTS)}
          style={{ paddingHorizontal: 0 }}
        />
      </View>
    </View>
  );
}
