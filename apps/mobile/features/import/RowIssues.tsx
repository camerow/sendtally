import React from "react";
import { Text, View } from "react-native";
import type { ImportIssue } from "@sendtally/core/import";
import { issueText } from "@sendtally/features/import";
import { t } from "@sendtally/features/i18n";
import { colors } from "@sendtally/design/tokens";
import { bodyText, monoMuted } from "../../lib/styles";
import { rowTitle } from "../sessions/SessionRow";
import { PreviewSection } from "./PreviewSection";

/** The rows the planner could not read, listed so the file can be fixed or imported without them. */
export function RowIssues({ issues }: { issues: ImportIssue[] }): React.ReactElement {
  return (
    <PreviewSection
      title={t("import.skippedTitle", { count: issues.length })}
      items={issues}
      showAllLabel={t("import.showAllRows", { total: issues.length })}
    >
      {(shown) =>
        shown.map((issue, i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              gap: 12,
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: colors.lineOnLightSoft,
            }}
          >
            <Text style={{ ...monoMuted, width: 58, paddingTop: 3 }}>
              {`${t("import.row")} ${issue.row}`}
            </Text>
            <View style={{ flex: 1, gap: 2 }}>
              {issue.climb !== undefined && (
                <Text style={{ ...rowTitle, fontSize: 14 }}>{issue.climb}</Text>
              )}
              <Text style={bodyText}>{issueText(issue)}</Text>
            </View>
          </View>
        ))
      }
    </PreviewSection>
  );
}
