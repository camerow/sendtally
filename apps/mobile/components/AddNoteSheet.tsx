import React from "react";
import { Pressable, Text, View } from "react-native";
import { TextInput } from "./TextInput";
import { t } from "@sendtally/features/i18n";
import { localDate } from "@sendtally/features/log-session";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { DateTimeField } from "./DateTimeField";
import { Sheet } from "./Sheet";
import { confirmDestructive } from "../lib/confirmDestructive";
import { primaryButton, primaryButtonLabel } from "../lib/styles";
import { Button } from "../features/training/components/Button";

export type AddNoteSheetProps = {
  /** The note to edit, "new" to write one, or null when closed. A session's note keeps its session's day. */
  note: { id: string; day: string; note: string; source?: "session" | "page" } | "new" | null;
  /** The day a new note starts on; today when not given. */
  day?: string;
  /** Saved on the phone first, so the sheet closes at once. */
  onSave: (day: string, note: string) => void;
  onDelete: (id: string) => void;
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
  note,
  day: startDay,
  onSave,
  onDelete,
  onClose,
}: AddNoteSheetProps): React.ReactElement {
  const editing = note !== "new" && note !== null ? note : null;
  const [day, setDay] = React.useState(() => localDate(new Date()));
  const [draft, setDraft] = React.useState("");

  const [wasOpen, setWasOpen] = React.useState<AddNoteSheetProps["note"]>(null);
  if (note !== wasOpen) {
    setWasOpen(note);
    setDay(editing?.day ?? startDay ?? localDate(new Date()));
    setDraft(editing?.note ?? "");
  }

  const save = (): void => {
    if (draft.trim() === "") return;
    onSave(day, draft.trim());
    onClose();
  };
  const remove = (): void => {
    if (editing === null) return;
    confirmDestructive({
      title: t("climbs.deleteNote"),
      action: t("common.delete"),
      onConfirm: () => {
        onDelete(editing.id);
        onClose();
      },
    });
  };

  return (
    <Sheet visible={note !== null} onClose={onClose} closeLabel={t("common.cancel")}>
      <View style={{ gap: 16, paddingTop: 2, paddingHorizontal: 18, paddingBottom: 18 }}>
        <Text
          style={{
            fontFamily: fonts.monoMedium,
            fontSize: 11,
            letterSpacing: 0.88,
            textTransform: "uppercase",
            color: colors.gunmetal,
          }}
        >
          {editing === null ? t("climbs.addNote") : t("climbs.editNote")}
        </Text>

        <View style={{ gap: 9 }}>
          <Text style={label}>{t("climbs.noteDate")}</Text>
          <DateTimeField
            mode="date"
            value={day}
            max={localDate(new Date())}
            label={t("climbs.noteDate")}
            disabled={editing?.source === "session"}
            onChange={setDay}
          />
        </View>

        <TextInput
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

        <Pressable
          onPress={save}
          disabled={draft.trim() === ""}
          accessibilityRole="button"
          style={{ ...primaryButton, opacity: draft.trim() === "" ? 0.45 : 1 }}
        >
          <Text style={primaryButtonLabel}>{t("common.save")}</Text>
        </Pressable>
        {editing !== null && (
          <Button label={t("climbs.deleteNote")} onPress={remove} variant="danger" />
        )}
      </View>
    </Sheet>
  );
}
