import React from "react";
import { Text, View } from "react-native";
import type { SendtallyApi, SessionTag } from "@sendtally/api-client";
import { useSessionTags } from "@sendtally/features/sessions";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { TagPicker } from "./TagPicker";

const heading = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  letterSpacing: 0.7,
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
    <View
      style={{
        gap: 12,
        backgroundColor: colors.surfaceSoft,
        borderRadius: radius.card,
        padding: 16,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text style={{ ...heading, color: colors.watermelonInk }}>TAGS</Text>
        {saving && <Text style={{ ...heading, color: colors.textFaint }}>SAVING…</Text>}
        {error !== null && <Text style={{ ...heading, color: colors.watermelonInk }}>{error}</Text>}
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
