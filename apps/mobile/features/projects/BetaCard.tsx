import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";

export type BetaCardProps = {
  beta: string | null;
  updatedLabel: string | null;
  onSave: (beta: string) => Promise<void>;
};

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

// Beta belongs to the climb rather than to any one session, so it is edited on
// the project itself and carries across every session the climb turns up in.
export function BetaCard({ beta, updatedLabel, onSave }: BetaCardProps): React.ReactElement {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(beta ?? "");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const save = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      await onSave(draft.trim());
      setBusy(false);
      setEditing(false);
    } catch {
      setBusy(false);
      setError(t("projects.betaSaveFailed"));
    }
  };

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
      <Text style={{ ...heading, color: colors.watermelonInk }}>{t("projects.beta")}</Text>
      {editing ? (
        <TextInput
          value={draft}
          autoFocus
          multiline
          maxLength={2000}
          placeholder={t("projects.betaEditPlaceholder")}
          placeholderTextColor={colors.textFaint}
          onChangeText={setDraft}
          style={{
            fontFamily: fonts.sans,
            fontSize: 14,
            lineHeight: 22,
            color: colors.gunmetal,
            minHeight: 96,
            textAlignVertical: "top",
          }}
        />
      ) : (
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 14,
            lineHeight: 22,
            color: beta === null ? colors.textFaint : colors.gunmetal,
          }}
        >
          {beta ?? t("projects.noBeta")}
        </Text>
      )}
      {error !== null && (
        <Text style={{ ...action, textTransform: "none", color: colors.watermelonInk }}>
          {error}
        </Text>
      )}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        {!editing && updatedLabel !== null && (
          <Text style={{ ...action, color: colors.textMuted }}>{updatedLabel}</Text>
        )}
        <View style={{ flex: 1 }} />
        {editing ? (
          <>
            <Pressable
              onPress={() => {
                setDraft(beta ?? "");
                setEditing(false);
              }}
              accessibilityRole="button"
              style={{ minHeight: 44, justifyContent: "center" }}
            >
              <Text style={{ ...action, color: colors.textMuted }}>{t("common.cancel")}</Text>
            </Pressable>
            <Pressable
              onPress={() => void save()}
              disabled={busy}
              accessibilityRole="button"
              style={{ minHeight: 44, justifyContent: "center" }}
            >
              <Text style={{ ...action, color: colors.azureInk }}>
                {busy ? t("common.saving") : t("common.save")}
              </Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={() => setEditing(true)}
            accessibilityRole="button"
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Text style={{ ...action, color: colors.azureInk }}>
              {beta === null ? t("projects.addBeta") : t("common.edit")}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
