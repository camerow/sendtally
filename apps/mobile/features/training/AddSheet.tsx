import { router, type Href } from "expo-router";
import React from "react";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { today } from "@sendtally/features/journal";
import { Sheet } from "../../components/Sheet";
import { MenuRow, type MenuRowProps } from "../live-session/MenuRow";

export type AddSheetProps = {
  visible: boolean;
  onClose: () => void;
};

type AddRow = Pick<MenuRowProps, "icon" | "title" | "hint"> & { key: string; href: () => Href };

const rows = (): AddRow[] => [
  {
    key: "session",
    icon: "sessions",
    title: t("training.logSession"),
    hint: t("training.logSessionBody"),
    href: () => "/session/new",
  },
  {
    key: "workout",
    icon: "train",
    title: t("training.startWorkout"),
    hint: t("training.startWorkoutBody"),
    href: () => "/(tabs)/train",
  },
  {
    key: "journal",
    icon: "journal",
    title: t("journal.journalEntry"),
    hint: t("training.journalEntryBody"),
    href: () => ({ pathname: "/journal/new", params: { kind: "journal", date: today() } }),
  },
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
