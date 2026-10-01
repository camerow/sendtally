import React from "react";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { Pressable, Text, View } from "react-native";
import type { ProjectSessionVM } from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import { localDate } from "@sendtally/features/log-session";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { DateTimeField } from "../../components/DateTimeField";
import { Sheet } from "../../components/Sheet";
import { primaryButton, primaryButtonLabel } from "../../lib/styles";

export type AddNoteSheetProps = {
  visible: boolean;
  sessions: ProjectSessionVM[];
  onSave: (day: string, note: string) => Promise<void>;
  onClose: () => void;
};

const label = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  lineHeight: 13,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  color: colors.textMuted,
} as const;

export function AddNoteSheet({
  visible,
  sessions,
  onSave,
  onClose,
}: AddNoteSheetProps): React.ReactElement {
  const [day, setDay] = React.useState(() => localDate(new Date()));
  const [draft, setDraft] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [wasVisible, setWasVisible] = React.useState(false);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setDay(localDate(new Date()));
      setDraft("");
      setError(null);
    }
  }

  const save = async (): Promise<void> => {
    if (draft.trim() === "") return;
    setBusy(true);
    setError(null);
    try {
      await onSave(day, draft.trim());
      setBusy(false);
      onClose();
    } catch {
      setBusy(false);
      setError(t("climbs.noteSaveFailed"));
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} closeLabel={t("common.cancel")}>
      <View style={{ gap: 16, paddingTop: 2, paddingHorizontal: 18, paddingBottom: 18 }}>
        <Text
          style={{
            fontFamily: fonts.monoMedium,
            fontSize: 11,
            letterSpacing: 0.88,
            textTransform: "uppercase",
            color: colors.labelAccent,
          }}
        >
          {t("climbs.addNote")}
        </Text>

        <View style={{ gap: 9 }}>
          <Text style={label}>{t("climbs.noteDate")}</Text>
          <DateTimeField
            mode="date"
            value={day}
            max={localDate(new Date())}
            label={t("climbs.noteDate")}
            onChange={setDay}
          />
          {!sessions.some((s) => s.day === day) && (
            <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted }}>
              {t("climbs.noteNewDayHint")}
            </Text>
          )}
        </View>

        <BottomSheetTextInput
          value={draft}
          multiline
          maxLength={2000}
          onChangeText={setDraft}
          placeholder={t("climbs.notePlaceholder")}
          placeholderTextColor={colors.textFaint}
          style={{
            fontFamily: fonts.sans,
            fontSize: 15,
            lineHeight: 22,
            color: colors.gunmetal,
            minHeight: 110,
            textAlignVertical: "top",
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: "rgba(64,63,76,0.15)",
            borderRadius: radius.control,
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        />

        {error !== null && (
          <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.watermelonInk }}>
            {error}
          </Text>
        )}

        <Pressable
          onPress={() => void save()}
          disabled={busy || draft.trim() === ""}
          accessibilityRole="button"
          style={{ ...primaryButton, opacity: busy || draft.trim() === "" ? 0.45 : 1 }}
        >
          <Text style={primaryButtonLabel}>{busy ? t("common.saving") : t("common.save")}</Text>
        </Pressable>
      </View>
    </Sheet>
  );
}
