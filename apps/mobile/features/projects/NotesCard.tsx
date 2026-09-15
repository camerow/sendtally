import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import type { ProjectNoteVM, ProjectSessionVM } from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";

export type NotesCardProps = {
  notes: ProjectNoteVM[];
  latestSession: ProjectSessionVM | undefined;
  onSave: (fingerprint: string, note: string) => Promise<void>;
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

const bodyText = {
  fontFamily: fonts.sans,
  fontSize: 14,
  lineHeight: 22,
  color: colors.gunmetal,
} as const;

// The notes are the beta: the newest one is what the climber knows now, and the
// ones under it are how they got there, each tied to the session it came from.
export function NotesCard({ notes, latestSession, onSave }: NotesCardProps): React.ReactElement {
  const [editing, setEditing] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const open = (fingerprint: string, note: string): void => {
    setEditing(fingerprint);
    setDraft(note);
    setError(null);
  };

  const save = async (fingerprint: string): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      await onSave(fingerprint, draft.trim());
      setBusy(false);
      setEditing(null);
    } catch {
      setBusy(false);
      setError(t("climbs.noteSaveFailed"));
    }
  };

  const [latest, ...older] = notes;
  const addTarget =
    latestSession !== undefined && latestSession.note === null ? latestSession : undefined;

  const editor = (fingerprint: string): React.ReactElement => (
    <View style={{ gap: 10 }}>
      <TextInput
        value={draft}
        autoFocus
        multiline
        maxLength={2000}
        placeholder={t("climbs.notePlaceholder")}
        placeholderTextColor={colors.textFaint}
        onChangeText={setDraft}
        style={{ ...bodyText, minHeight: 88, textAlignVertical: "top" }}
      />
      {error !== null && (
        <Text style={{ ...action, textTransform: "none", color: colors.watermelonInk }}>
          {error}
        </Text>
      )}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => setEditing(null)}
          accessibilityRole="button"
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text style={{ ...action, color: colors.textMuted }}>{t("common.cancel")}</Text>
        </Pressable>
        <Pressable
          onPress={() => void save(fingerprint)}
          disabled={busy}
          accessibilityRole="button"
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text style={{ ...action, color: colors.azureInk }}>
            {busy ? t("common.saving") : t("common.save")}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View
      style={{
        gap: 14,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.lineOnLight,
        borderRadius: radius.card,
        padding: 16,
      }}
    >
      <Text style={{ ...heading, color: colors.watermelonInk }}>{t("climbs.notes")}</Text>

      {latest !== undefined &&
        (editing === latest.fingerprint ? (
          editor(latest.fingerprint)
        ) : (
          <Pressable
            onPress={() => open(latest.fingerprint, latest.note)}
            accessibilityRole="button"
            style={{
              gap: 8,
              padding: 14,
              borderRadius: radius.control,
              backgroundColor: colors.gold,
            }}
          >
            <Text style={{ ...action, fontSize: 10, color: colors.textSecondary }}>
              {t("climbs.noteLatest", { date: latest.dateLabel })}
            </Text>
            <Text style={{ ...bodyText, fontSize: 15 }}>{latest.note}</Text>
          </Pressable>
        ))}

      {addTarget !== undefined &&
        (editing === addTarget.fingerprint ? (
          editor(addTarget.fingerprint)
        ) : (
          <Pressable
            onPress={() => open(addTarget.fingerprint, "")}
            accessibilityRole="button"
            style={{
              alignSelf: "flex-start",
              minHeight: 44,
              justifyContent: "center",
              paddingHorizontal: 14,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: colors.lineOnLightStrong,
            }}
          >
            <Text style={{ ...action, fontSize: 10, color: colors.textSecondary }}>
              {t("climbs.addNoteFor", { date: addTarget.dateLabel })}
            </Text>
          </Pressable>
        ))}

      {notes.length === 0 && addTarget === undefined && (
        <Text style={{ ...bodyText, color: colors.textFaint }}>{t("climbs.noNotes")}</Text>
      )}

      {older.map((note) => (
        <View
          key={note.fingerprint}
          style={{
            gap: 6,
            paddingTop: 14,
            borderTopWidth: 1,
            borderTopColor: colors.lineOnLightSoft,
          }}
        >
          {editing === note.fingerprint ? (
            editor(note.fingerprint)
          ) : (
            <Pressable onPress={() => open(note.fingerprint, note.note)} accessibilityRole="button">
              <Text
                style={{
                  fontFamily: fonts.monoSemiBold,
                  fontSize: 13,
                  color: colors.gunmetal,
                  textTransform: "uppercase",
                }}
              >
                {note.dateLabel}
              </Text>
              <Text style={{ ...bodyText, marginTop: 4 }}>{note.note}</Text>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}
