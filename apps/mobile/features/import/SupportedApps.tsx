import React from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { exportPageUrl, IMPORT_SERVICES } from "@sendtally/core/import";
import { t } from "@sendtally/features/i18n";
import { colors } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { SectionHeading } from "../../components/SectionHeading";
import { pressRow } from "../../lib/press";
import { rowMeta, rowTitle } from "../sessions/SessionRow";

const GOOGLE_SEARCH = "https://www.google.com/search?q=";

export function linkHint(url: string): string {
  return url.startsWith(GOOGLE_SEARCH)
    ? `Google: ${decodeURIComponent(url.slice(GOOGLE_SEARCH.length))}`
    : url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]!;
}

/** Each app that exports a file Sendtally reads, linking to where that export lives. */
export function SupportedApps(): React.ReactElement {
  return (
    <View>
      <SectionHeading title={t("import.supportedApps")} />
      {(Object.keys(IMPORT_SERVICES) as (keyof typeof IMPORT_SERVICES)[])
        .sort((a, b) => IMPORT_SERVICES[a].localeCompare(IMPORT_SERVICES[b]))
        .map((format) => {
          const url = exportPageUrl(format);
          return (
            <Pressable
              key={format}
              onPress={() => void Linking.openURL(url)}
              accessibilityRole="link"
              style={pressRow({
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                minHeight: 56,
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: colors.lineOnLightSoft,
              })}
            >
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ ...rowTitle, color: colors.azureInk }}>
                  {IMPORT_SERVICES[format]}
                </Text>
                <Text style={rowMeta}>{linkHint(url)}</Text>
              </View>
              <Icon name="external" size={18} color={colors.azureInk} />
            </Pressable>
          );
        })}
    </View>
  );
}
