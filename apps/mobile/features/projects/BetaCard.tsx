import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { colors, fonts, radius } from "@sendtally/design/tokens";

export type BetaCardProps = {
  beta: string | null;
  updatedLabel: string | null;
  onSave: (beta: string) => Promise<void>;
};

const heading = { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 0.8 } as const;
const action = { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 0.6 } as const;

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
      setError("Could not save the beta. Try again.");
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
      <Text style={{ ...heading, color: colors.watermelonInk }}>BETA</Text>
      {editing ? (
        <TextInput
          value={draft}
          autoFocus
          multiline
          maxLength={2000}
          placeholder="The moves, the sequence, what went wrong last time."
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
          {beta ?? "No beta yet. Write down the sequence while it is fresh."}
        </Text>
      )}
      {error !== null && <Text style={{ ...action, color: colors.watermelonInk }}>{error}</Text>}
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
              <Text style={{ ...action, color: colors.textMuted }}>CANCEL</Text>
            </Pressable>
            <Pressable
              onPress={() => void save()}
              disabled={busy}
              accessibilityRole="button"
              style={{ minHeight: 44, justifyContent: "center" }}
            >
              <Text style={{ ...action, color: colors.azureInk }}>{busy ? "SAVING…" : "SAVE"}</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={() => setEditing(true)}
            accessibilityRole="button"
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Text style={{ ...action, color: colors.azureInk }}>
              {beta === null ? "ADD BETA" : "EDIT"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
