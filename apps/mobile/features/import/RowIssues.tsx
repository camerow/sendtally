import React from "react";
import { Pressable, Text, View } from "react-native";
import type { ImportIssue } from "@sendtally/core/import";
import { issueText } from "@sendtally/features/import";
import { t } from "@sendtally/features/i18n";
import { colors } from "@sendtally/design/tokens";
import { press } from "../../lib/press";
import { bodyText, monoMuted, underlineLabel, underlinePress } from "../../lib/styles";
import { Label } from "../training/components/Label";
import { AMBER } from "../training/components/tints";
import { rowTitle } from "../sessions/SessionRow";

const PREVIEW = 3;

/** The rows the planner could not read, listed so the file can be fixed or imported without them. */
export function RowIssues({ issues }: { issues: ImportIssue[] }): React.ReactElement {
  const [all, setAll] = React.useState(false);
  return (
    <View>
      <View style={{ minHeight: 36, justifyContent: "center" }}>
        <Label color={AMBER}>{t("import.skippedTitle", { count: issues.length })}</Label>
      </View>
      {(all ? issues : issues.slice(0, PREVIEW)).map((issue, i) => (
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
      ))}
      {!all && issues.length > PREVIEW && (
        <Pressable
          onPress={() => setAll(true)}
          accessibilityRole="button"
          style={press(underlinePress)}
        >
          <Text style={underlineLabel}>{t("import.showAllRows", { total: issues.length })}</Text>
        </Pressable>
      )}
    </View>
  );
}
