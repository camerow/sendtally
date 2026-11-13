import React from "react";
import { View } from "react-native";
import type { ImportSession, LikelyDuplicate } from "@sendtally/core/import";
import { t } from "@sendtally/features/i18n";
import { SwitchRow } from "../settings/SwitchRow";
import { PreviewSection } from "./PreviewSection";
import { SessionsByMonth } from "./SessionsByMonth";

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
  const rows = [...duplicates].reverse().map(({ index, logged }) => ({
    session: sessions[index]!,
    meta: t("import.likelyMatch", { name: logged.title || t("common.climbingSession") }),
  }));
  return (
    <View>
      <PreviewSection
        title={t("import.likelyTitle", { count: rows.length })}
        items={rows}
        showAllLabel={t("import.showAll", { total: rows.length })}
      >
        {(shown) => <SessionsByMonth rows={shown} />}
      </PreviewSection>
      <SwitchRow
        title={t("import.importAnyway", { count: rows.length })}
        checked={importAnyway}
        onChange={onImportAnyway}
      />
    </View>
  );
}
