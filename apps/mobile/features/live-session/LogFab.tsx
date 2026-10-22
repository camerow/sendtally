import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { ENTRY_KINDS, entryKindLabel, today, type EntryKind } from "@sendtally/features/journal";
import { Icon } from "../../components/Icon";
import { Sheet } from "../../components/Sheet";
import { press } from "../../lib/press";
import { MenuRow } from "./MenuRow";

const ENTRY_HINTS: Record<
  EntryKind,
  "journal.hintJournal" | "journal.hintTrip" | "journal.hintInjury"
> = {
  journal: "journal.hintJournal",
  trip: "journal.hintTrip",
  injury: "journal.hintInjury",
};

export type LogFabProps = { onLogClimb: () => void };

/**
 * One climb is the frequent action, so it gets the wide half. The chevron half holds the
 * slower paths: the full form and the journal entry kinds.
 */
export function LogFab({ onLogClimb }: LogFabProps): React.ReactElement {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const pickEntry = (kind: EntryKind): void => {
    setMenuOpen(false);
    router.push({ pathname: "/journal/new", params: { kind, date: today() } });
  };

  return (
    <>
      <View
        style={{
          position: "absolute",
          right: 18,
          bottom: 16,
          flexDirection: "row",
          height: 52,
          borderRadius: 26,
          overflow: "hidden",
          backgroundColor: colors.azureInk,
          shadowColor: "#14131A",
          shadowOpacity: 0.28,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
        }}
      >
        <Pressable
          onPress={onLogClimb}
          accessibilityRole="button"
          style={press({
            flexDirection: "row",
            alignItems: "center",
            gap: 9,
            paddingLeft: 22,
            paddingRight: 18,
          })}
        >
          <Icon name="plus" size={17} strokeWidth={3} color={colors.white} />
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.white }}>
            {t("sessions.logClimb")}
          </Text>
        </Pressable>
        <View style={{ width: 1, marginVertical: 10, backgroundColor: "rgba(255,255,255,0.28)" }} />
        <Pressable
          onPress={() => setMenuOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t("sessions.moreWaysToLog")}
          style={press({ width: 48, alignItems: "center", justifyContent: "center" })}
        >
          <View style={{ transform: [{ rotate: "-90deg" }] }}>
            <Icon name="chevron" size={14} strokeWidth={2.4} color={colors.white} />
          </View>
        </Pressable>
      </View>

      <Sheet visible={menuOpen} onClose={() => setMenuOpen(false)} closeLabel={t("common.cancel")}>
        <View style={{ gap: 4, paddingTop: 4, paddingHorizontal: 12, paddingBottom: 4 }}>
          <MenuRow
            icon="plus"
            title={t("sessions.logAClimb")}
            hint={t("sessions.logAClimbHint")}
            onPress={() => {
              setMenuOpen(false);
              onLogClimb();
            }}
          />
          <MenuRow
            icon="sessions"
            title={t("sessions.logFullSession")}
            hint={t("sessions.logFullSessionHint")}
            onPress={() => {
              setMenuOpen(false);
              router.push("/session/new");
            }}
          />
          {ENTRY_KINDS.map((kind) => (
            <MenuRow
              key={kind}
              icon={kind}
              title={entryKindLabel(kind)}
              hint={t(ENTRY_HINTS[kind])}
              onPress={() => pickEntry(kind)}
            />
          ))}
        </View>
      </Sheet>
    </>
  );
}
