import { router, type Href } from "expo-router";
import React from "react";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { ENTRY_KINDS, entryKindLabel, today, type EntryKind } from "@sendtally/features/journal";
import { Fab } from "../../components/Fab";
import { Sheet } from "../../components/Sheet";
import { MenuRow, type MenuRowProps } from "./MenuRow";
import { startLiveSession } from "./startLiveSession";

const ENTRY_HINTS: Record<
  EntryKind,
  "journal.hintJournal" | "journal.hintTrip" | "journal.hintInjury"
> = {
  journal: "journal.hintJournal",
  trip: "journal.hintTrip",
  injury: "journal.hintInjury",
};

type Row = Pick<MenuRowProps, "icon" | "title" | "hint"> & { key: string; href: Href };

const rows = (): Row[] => [
  {
    key: "session",
    icon: "sessions",
    title: t("sessions.pastSession"),
    hint: t("sessions.logFullSessionHint"),
    href: "/session/new",
  },
  {
    key: "activity",
    icon: "train",
    title: t("training.logTraining"),
    hint: t("training.logTrainingBody"),
    href: { pathname: "/activity/new", params: { date: today() } },
  },
  ...ENTRY_KINDS.map((kind): Row => ({
    key: kind,
    icon: kind,
    title: entryKindLabel(kind),
    hint: t(ENTRY_HINTS[kind]),
    href: { pathname: "/journal/new", params: { kind, date: today() } },
  })),
];

/** The live session is the frequent action; the arrow holds the slower ways to log. */
export function LogFab(): React.ReactElement {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <>
      <Fab
        label={t("tally.startSession")}
        onPress={() => startLiveSession()}
        menu={{ label: t("sessions.moreWaysToLog"), onPress: () => setMenuOpen(true) }}
      />
      <Sheet visible={menuOpen} onClose={() => setMenuOpen(false)} closeLabel={t("common.cancel")}>
        <View style={{ gap: 4, paddingTop: 4, paddingHorizontal: 12, paddingBottom: 4 }}>
          {rows().map((row) => (
            <MenuRow
              key={row.key}
              icon={row.icon}
              title={row.title}
              hint={row.hint}
              onPress={() => {
                setMenuOpen(false);
                router.push(row.href);
              }}
            />
          ))}
        </View>
      </Sheet>
    </>
  );
}
