import React from "react";
import { Text, View } from "react-native";
import type { SendtallyApi, SessionTag } from "@sendtally/api-client";
import { useSessionTags } from "@sendtally/features/sessions";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { TagPicker } from "./TagPicker";

const heading = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  letterSpacing: 0.7,
  textTransform: "uppercase",
} as const;

export function SessionTags({
  api,
  fingerprint,
  initial,
}: {
  api: SendtallyApi;
  fingerprint: string;
  initial: SessionTag[];
}): React.ReactElement {
  const { tags, suggestions, saving, error, add, remove } = useSessionTags(
    api,
    fingerprint,
    initial
  );

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text style={{ ...heading, color: colors.watermelonInk }}>{t("common.tags")}</Text>
        {saving && (
          <Text style={{ ...heading, color: colors.textFaint }}>{t("common.saving")}</Text>
        )}
        {error !== null && (
          <Text style={{ ...heading, textTransform: "none", color: colors.watermelonInk }}>
            {error}
          </Text>
        )}
      </View>
      <TagPicker
        tags={tags}
        suggestions={suggestions}
        disabled={saving}
        onAdd={add}
        onRemove={remove}
      />
    </View>
  );
}
