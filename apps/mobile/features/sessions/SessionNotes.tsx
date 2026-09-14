import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import type { SendtallyApi } from "@sendtally/api-client";
import { useSessionNotes } from "@sendtally/features/session-detail";
import { SESSION_NOTE_MAX } from "@sendtally/features/sessions";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { press } from "../../lib/press";

const heading = {
  fontFamily: fonts.monoMedium,
  fontSize: 11,
  letterSpacing: 0.8,
  textTransform: "uppercase",
} as const;

const action = {
  fontFamily: fonts.monoMedium,
  fontSize: 11,
  letterSpacing: 0.6,
  textTransform: "uppercase",
} as const;

const CLAMP_AT = 320;

export function SessionNotes({
  api,
  fingerprint,
  initial,
}: {
  api: SendtallyApi;
  fingerprint: string;
  initial: string | null;
}): React.ReactElement {
  const { notes, draft, setDraft, editing, start, cancel, save, saving, error } = useSessionNotes(
    api,
    fingerprint,
    initial
  );
  const [expanded, setExpanded] = React.useState(false);

  if (editing) {
    return (
      <View
        style={{
          gap: 10,
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: colors.lineOnLight,
          borderRadius: radius.card,
          padding: 16,
        }}
      >
        <Text style={{ ...heading, color: colors.watermelonInk }}>{t("common.notes")}</Text>
        <TextInput
          value={draft}
          autoFocus
          multiline
          maxLength={SESSION_NOTE_MAX}
          placeholder={t("common.notesPlaceholder")}
          placeholderTextColor={colors.textFaint}
          onChangeText={setDraft}
          style={{
            fontFamily: fonts.sans,
            fontSize: 15,
            lineHeight: 22,
            color: colors.gunmetal,
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: "rgba(64,63,76,0.15)",
            borderRadius: radius.control,
            paddingHorizontal: 13,
            paddingVertical: 12,
            minHeight: 132,
            textAlignVertical: "top",
          }}
        />
        <View
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <Text
            style={{
              fontFamily: fonts.monoMedium,
              fontSize: 10,
              letterSpacing: 0.8,
              color: error === null ? colors.textFaint : colors.watermelonInk,
            }}
          >
            {error ?? `${draft.length} / ${SESSION_NOTE_MAX}`}
          </Text>
          <View style={{ flexDirection: "row", gap: 18 }}>
            <Pressable
              onPress={cancel}
              disabled={saving}
              style={press({ minHeight: 44, justifyContent: "center" })}
            >
              <Text style={{ ...action, color: colors.textSecondary }}>{t("common.cancel")}</Text>
            </Pressable>
            <Pressable
              onPress={save}
              disabled={saving}
              style={press({ minHeight: 44, justifyContent: "center" })}
            >
              <Text style={{ ...action, color: colors.labelAccent }}>
                {saving ? t("common.saving") : t("sessions.saveNote")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  if (notes === null) {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          backgroundColor: colors.surfaceSoft,
          borderRadius: radius.card,
          padding: 16,
        }}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ ...heading, color: colors.textMuted }}>{t("common.notes")}</Text>
          <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors.textSecondary }}>
            {t("common.notesPlaceholder")}
          </Text>
        </View>
        <Pressable onPress={start} style={press({ minHeight: 44, justifyContent: "center" })}>
          <Text style={{ ...action, color: colors.labelAccent }}>{t("sessions.addANote")}</Text>
        </Pressable>
      </View>
    );
  }

  const clamp = !expanded && notes.length > CLAMP_AT;

  return (
    <View
      style={{
        gap: 10,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.lineOnLight,
        borderRadius: radius.card,
        padding: 16,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ ...heading, color: colors.watermelonInk }}>{t("common.notes")}</Text>
        <Pressable onPress={start} style={press({ minHeight: 32, justifyContent: "center" })}>
          <Text style={{ ...action, color: colors.azureInk }}>{t("common.edit")}</Text>
        </Pressable>
      </View>
      <Text
        numberOfLines={clamp ? 5 : undefined}
        style={{
          fontFamily: fonts.sans,
          fontSize: 15,
          lineHeight: 22,
          color: "rgba(64,63,76,0.88)",
        }}
      >
        {notes}
      </Text>
      {(clamp || expanded) && (
        <Pressable
          onPress={() => setExpanded(!expanded)}
          style={{ minHeight: 32, justifyContent: "center" }}
        >
          <Text style={{ ...action, fontSize: 10, letterSpacing: 0.8, color: colors.azureInk }}>
            {expanded ? t("sessions.showLess") : t("sessions.showMore")}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
