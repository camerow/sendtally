import { router, type Href } from "expo-router";
import React from "react";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { ENTRY_KINDS, entryKindLabel, today, type EntryKind } from "@sendtally/features/journal";
import { Sheet } from "../../components/Sheet";
import { MenuRow, type MenuRowProps } from "../live-session/MenuRow";

export type AddSheetProps = {
  visible: boolean;
  onClose: () => void;
};

type AddRow = Pick<MenuRowProps, "icon" | "title" | "hint"> & { key: string; href: () => Href };

const ENTRY_HINTS: Record<
  EntryKind,
  "journal.hintJournal" | "journal.hintTrip" | "journal.hintInjury"
> = {
  journal: "journal.hintJournal",
  trip: "journal.hintTrip",
  injury: "journal.hintInjury",
};

const rows = (): AddRow[] => [
  {
    key: "climb",
    icon: "plus",
    title: t("sessions.logAClimb"),
    hint: t("sessions.logAClimbHint"),
    href: () => ({ pathname: "/(tabs)/sessions", params: { add: "climb" } }),
  },
  {
    key: "session",
    icon: "sessions",
    title: t("sessions.logFullSession"),
    hint: t("sessions.logFullSessionHint"),
    href: () => "/session/new",
  },
  {
    key: "workout",
    icon: "train",
    title: t("training.startWorkout"),
    hint: t("training.startWorkoutBody"),
    href: () => "/(tabs)/train",
  },
  ...ENTRY_KINDS.map((kind): AddRow => ({
    key: kind,
    icon: kind,
    title: entryKindLabel(kind),
    hint: t(ENTRY_HINTS[kind]),
    href: () => ({ pathname: "/journal/new", params: { kind, date: today() } }),
  })),
];

export function AddSheet({ visible, onClose }: AddSheetProps): React.ReactElement {
  return (
    <Sheet visible={visible} onClose={onClose} closeLabel={t("training.closeAdd")}>
      <View style={{ gap: 4, paddingTop: 4, paddingHorizontal: 12, paddingBottom: 4 }}>
        {rows().map((row) => (
          <MenuRow
            key={row.key}
            icon={row.icon}
            title={row.title}
            hint={row.hint}
            onPress={() => {
              onClose();
              router.push(row.href());
            }}
          />
        ))}
      </View>
    </Sheet>
  );
}
