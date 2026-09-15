import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { ENTRY_KINDS, entryKindLabel, today, type EntryKind } from "@sendtally/features/journal";
import { colors, fonts } from "@sendtally/design/tokens";
import { Sheet } from "../../components/Sheet";
import { pressRow } from "../../lib/press";
import { EntryKindIcon } from "./EntryKindIcon";

const HINTS: Record<EntryKind, "journal.hintJournal" | "journal.hintTrip" | "journal.hintInjury"> =
  {
    journal: "journal.hintJournal",
    trip: "journal.hintTrip",
    injury: "journal.hintInjury",
  };

/** The kind is chosen on the way in, so the composer opens already being the thing you picked. */
export function NewEntrySheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}): React.ReactElement {
  const pick = (kind: EntryKind): void => {
    onClose();
    router.push({ pathname: "/journal/new", params: { kind, date: today() } });
  };
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      closeLabel={t("common.closeOptions", { label: t("journal.newEntry") })}
    >
      <View style={{ paddingHorizontal: 18, paddingTop: 12, paddingBottom: 8 }}>
        <Text
          style={{
            fontFamily: fonts.monoMedium,
            fontSize: 10,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: colors.textFaint,
            marginBottom: 4,
          }}
        >
          {t("journal.newEntry")}
        </Text>
        {ENTRY_KINDS.map((kind, i) => (
          <Pressable
            key={kind}
            onPress={() => pick(kind)}
            accessibilityRole="button"
            style={pressRow({
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              minHeight: 60,
              paddingVertical: 8,
              borderBottomWidth: i === ENTRY_KINDS.length - 1 ? 0 : 1,
              borderBottomColor: colors.lineOnLightSoft,
            })}
          >
            <EntryKindIcon kind={kind} color={colors.textMuted} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                style={{ fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.gunmetal }}
              >
                {entryKindLabel(kind)}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 13,
                  lineHeight: 18,
                  color: colors.textMuted,
                }}
              >
                {t(HINTS[kind])}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}
