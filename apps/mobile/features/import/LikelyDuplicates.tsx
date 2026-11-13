import React from "react";
import { Pressable, Text, View } from "react-native";
import type { ImportSession, LikelyDuplicate } from "@sendtally/core/import";
import { t } from "@sendtally/features/i18n";
import { press } from "../../lib/press";
import { underlineLabel, underlinePress } from "../../lib/styles";
import { SwitchRow } from "../settings/SwitchRow";
import { Label } from "../training/components/Label";
import { AMBER } from "../training/components/tints";
import { PlannedSessionRow } from "./PlannedSessionRow";

const PREVIEW = 3;

/** Sessions that look like ones already in the log, left out unless the switch says otherwise. */
export function LikelyDuplicates({
  sessions,
  duplicates,
  importAnyway,
  onImportAnyway,
}: {
  sessions: ImportSession[];
  duplicates: LikelyDuplicate[];
  importAnyway: boolean;
  onImportAnyway: (value: boolean) => void;
}): React.ReactElement {
  const [all, setAll] = React.useState(false);
  const newestFirst = [...duplicates].reverse();
  return (
    <View>
      <View style={{ minHeight: 36, justifyContent: "center" }}>
        <Label color={AMBER}>{t("import.likelyTitle", { count: duplicates.length })}</Label>
      </View>
      <View style={{ marginHorizontal: -18 }}>
        {(all ? newestFirst : newestFirst.slice(0, PREVIEW)).map(({ index, logged }) => (
          <PlannedSessionRow
            key={index}
            session={sessions[index]!}
            meta={t("import.likelyMatch", { name: logged.title || t("common.climbingSession") })}
          />
        ))}
      </View>
      {!all && duplicates.length > PREVIEW && (
        <Pressable
          onPress={() => setAll(true)}
          accessibilityRole="button"
          style={press(underlinePress)}
        >
          <Text style={underlineLabel}>{t("import.showAll", { total: duplicates.length })}</Text>
        </Pressable>
      )}
      <SwitchRow
        title={t("import.importAnyway", { count: duplicates.length })}
        checked={importAnyway}
        disabled={false}
        onChange={onImportAnyway}
      />
    </View>
  );
}
