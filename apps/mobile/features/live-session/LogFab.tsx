import { router, type Href } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { entryKindLabel, today, type EntryKind } from "@sendtally/features/journal";
import { Fab } from "../../components/Fab";
import { Sheet } from "../../components/Sheet";
import { MenuRow, type MenuRowProps } from "./MenuRow";
import { startLiveSession } from "./startLiveSession";

type Row = Pick<MenuRowProps, "icon" | "title" | "hint"> & { key: string; go: () => void };

const ENTRY_HINTS: Record<
  EntryKind,
  "journal.hintJournal" | "journal.hintTrip" | "journal.hintInjury"
> = {
  journal: "journal.hintJournal",
  trip: "journal.hintTrip",
  injury: "journal.hintInjury",
};

const entryRow = (kind: EntryKind): Row => ({
  key: kind,
  icon: kind,
  title: entryKindLabel(kind),
  hint: t(ENTRY_HINTS[kind]),
  go: () => router.push({ pathname: "/journal/new", params: { kind, date: today() } }),
});

const push = (href: Href) => (): void => router.push(href);

const groups = (): { title: string; rows: Row[] }[] => [
  {
    title: t("statistics.climbing"),
    rows: [
      {
        key: "live",
        icon: "climb",
        title: t("sessions.liveSession"),
        hint: t("sessions.liveSessionHint"),
        go: () => startLiveSession(),
      },
      {
        key: "session",
        icon: "sessions",
        title: t("climbs.logSession"),
        hint: t("sessions.logFullSessionHint"),
        go: push("/session/new"),
      },
      {
        key: "climb",
        icon: "climbs",
        title: t("climbs.addClimb"),
        hint: t("climbs.addClimbHint"),
        go: push("/climb/log"),
      },
      entryRow("trip"),
    ],
  },
  { title: t("statistics.training"), rows: [entryRow("journal"), entryRow("injury")] },
];

/** Every way to log, climbing and training, behind one button. */
export function LogFab(): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Fab label={t("sessions.logAction")} onPress={() => setOpen(true)} />
      <Sheet visible={open} onClose={() => setOpen(false)} closeLabel={t("common.cancel")}>
        <View style={{ gap: 12, paddingTop: 4, paddingHorizontal: 12, paddingBottom: 4 }}>
          {groups().map((group) => (
            <View key={group.title} style={{ gap: 4 }}>
              <Text
                accessibilityRole="header"
                style={{
                  paddingHorizontal: 14,
                  fontFamily: fonts.monoMedium,
                  fontSize: 10,
                  lineHeight: 13,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  color: colors.textMuted,
                }}
              >
                {group.title}
              </Text>
              {group.rows.map((row) => (
                <MenuRow
                  key={row.key}
                  icon={row.icon}
                  title={row.title}
                  hint={row.hint}
                  onPress={() => {
                    setOpen(false);
                    row.go();
                  }}
                />
              ))}
            </View>
          ))}
        </View>
      </Sheet>
    </>
  );
}
